'use strict';
'require view';
'require ui';
'require rpc';
'require uci';
'require form';
'require tools.firewall as fwtool';

function time_elapsed(tend) {
	if (!tend) return true;
	const now = Math.floor(Date.now() / 1000);
	return now > parseInt(tend);
}

return view.extend({
	callHostHints: rpc.declare({
		object: 'luci-rpc',
		method: 'getHostHints',
		expect: { '': {} }
	}),

	load() {
		return Promise.all([
			this.callHostHints(),
			uci.load('access_control'),
			uci.load('firewall')
		]);
	},

	render([hosts]) {
		let m1, s1, m2, s2, o;

		// 1. Global Settings Map
		m1 = new form.Map('access_control', _('Internet Access Control'),
			_('Access Control allows you to manage Internet access for specific local hosts.<br/>' +
			  'Each rule defines when a device should be blocked from having Internet access. The rules may be active permanently or during certain times of the day.<br/>' +
			  'The rules may also be restricted to specific days of the week.<br/>' +
			  'Any device that is blocked may obtain a ticket suspending the restriction for a specified time.'));

		s1 = m1.section(form.NamedSection, 'general', 'access_control', _('General settings'));
		s1.anonymous = true;
		s1.addremove = false;

		o = s1.option(form.Flag, 'enabled', _('Enabled'),
			_('Must be set to enable the internet access blocking'));
		o.rmempty = false;

		o = s1.option(form.Value, 'ticket', _('Ticket time [min]'),
			_('Time granted when a ticket is issued'));
		o.datatype = 'uinteger';
		o.default = '60';

		// 2. Firewall Rules Grid Map
		m2 = new form.Map('firewall');

		s2 = m2.section(form.GridSection, 'rule', _('Client Rules'));
		s2.addremove = true;
		s2.anonymous = true;
		s2.sortable = true;
		s2.filterrow = true;

		s2.taboption = function(tabName, ...args) {
			return this.option(...args);
		};

		s2.filter = function(section_id) {
			return (uci.get('firewall', section_id, 'ac_enabled') != null);
		};

		s2.handleAdd = function(ev) {
			const section_id = uci.add('firewall', 'rule');
			uci.set('firewall', section_id, 'ac_enabled', '1');
			uci.set('firewall', section_id, 'enabled', '1');
			uci.set('firewall', section_id, 'src', 'lan');
			uci.set('firewall', section_id, 'dest', 'wan');
			uci.set('firewall', section_id, 'target', 'REJECT');
			uci.set('firewall', section_id, 'proto', 'all');
			this.map.addedSection = section_id;
			return this.renderMoreOptionsModal(section_id);
		};

		// Option: name (Name / 名称)
		o = s2.option(form.Value, 'name', _('Name'));
		o.rmempty = false;
		o.editable = false; // read-only in table grid

		// Option: ac_enabled (Enable)
		o = s2.option(form.Flag, 'ac_enabled', _('Enabled'));
		o.editable = true;
		o.rmempty = false;
		o.write = function(section_id, value) {
			if (value === '0') {
				uci.unset('firewall', section_id, 'ac_suspend');
				uci.set('firewall', section_id, 'enabled', '0');
			} else {
				const susp = uci.get('firewall', section_id, 'ac_suspend');
				if (susp && time_elapsed(susp)) {
					uci.unset('firewall', section_id, 'ac_suspend');
					uci.set('firewall', section_id, 'enabled', '1');
				} else if (susp) {
					uci.set('firewall', section_id, 'enabled', '0');
				} else {
					uci.set('firewall', section_id, 'enabled', '1');
				}
			}
			return uci.set('firewall', section_id, 'ac_enabled', value);
		};

		// Option: _ticket (Ticket Action)
		o = s2.option(form.Button, '_ticket', _('Ticket'));
		o.modalonly = false;
		o.editable = true;
		o.depends('ac_enabled', '1');

		o.inputtitle = function(section_id) {
			const susp = uci.get('firewall', section_id, 'ac_suspend');
			if (susp) {
				if (time_elapsed(susp)) {
					return _('Issue');
				} else {
					const date = new Date(parseInt(susp) * 1000);
					const hh = String(date.getHours()).padStart(2, '0');
					const mm = String(date.getMinutes()).padStart(2, '0');
					return `${hh}:${mm} (${_('Cancel')})`;
				}
			}
			return _('Issue');
		};

		o.inputstyle = function(section_id) {
			const susp = uci.get('firewall', section_id, 'ac_suspend');
			if (susp && !time_elapsed(susp)) {
				return 'reset';
			}
			return 'add';
		};

		o.onclick = function(ev, section_id) {
			const susp = uci.get('firewall', section_id, 'ac_suspend');
			if (susp && !time_elapsed(susp)) {
				// Cancel ticket:
				uci.unset('firewall', section_id, 'ac_suspend');
				uci.set('firewall', section_id, 'enabled', uci.get('firewall', section_id, 'ac_enabled') || '0');
				return uci.save()
					.then(L.bind(ui.changes.init, ui.changes))
					.then(L.bind(ui.changes.apply, ui.changes))
					.then(function() {
						window.location.reload();
					});
			} else {
				// Issue ticket: Prompt for minutes
				const default_min = uci.get('access_control', 'general', 'ticket') || '60';
				const mins = prompt(_('Enter ticket duration (minutes):'), default_min);
				if (mins === null) return;
				const duration = parseInt(mins);
				if (isNaN(duration) || duration <= 0) {
					alert(_('Invalid duration'));
					return;
				}
				const expiry = Math.floor(Date.now() / 1000) + duration * 60;
				uci.set('firewall', section_id, 'ac_suspend', String(expiry));
				uci.set('firewall', section_id, 'enabled', '0'); // Disable blocking during ticket
				return uci.save()
					.then(L.bind(ui.changes.init, ui.changes))
					.then(L.bind(ui.changes.apply, ui.changes))
					.then(function() {
						window.location.reload();
					});
			}
		};

		// Option: MAC Address (using fwtool helper!)
		fwtool.addMACOption(s2, 'general', 'src_mac', _('MAC address'), null, hosts);

		// Option: start_time (Start time)
		o = s2.option(form.Value, 'start_time', _('Start time'));
		o.modalonly = true;
		o.datatype = 'timehhmmss';
		o.placeholder = 'HH:MM:SS';

		// Option: stop_time (End time)
		o = s2.option(form.Value, 'stop_time', _('End time'));
		o.modalonly = true;
		o.datatype = 'timehhmmss';
		o.placeholder = 'HH:MM:SS';

		// Option: weekdays (using MultiValue select dropdown!)
		o = s2.option(form.MultiValue, 'weekdays', _('Weekdays'));
		o.modalonly = true;
		o.multiple = true;
		o.placeholder = _('Any day');
		o.value('Sun', _('Sunday'));
		o.value('Mon', _('Monday'));
		o.value('Tue', _('Tuesday'));
		o.value('Wed', _('Wednesday'));
		o.value('Thu', _('Thursday'));
		o.value('Fri', _('Friday'));
		o.value('Sat', _('Saturday'));
		o.write = function(section_id, value) {
			return this.super('write', [ section_id, L.toArray(value).join(' ') ]);
		};

		return Promise.all([
			m1.render(),
			m2.render()
		]).then(function(nodes) {
			return E('div', {}, nodes);
		});
	}
});
