'use strict';
'require baseclass';
'require rpc';
'require uci';

/* Direct ubus RPC calls for business operations */

var callUciCommit = rpc.declare({
    object: 'uci',
    method: 'commit',
    params: [ 'config' ],
    reject: true
});

var callServiceRestart = rpc.declare({
    object: 'rc',
    method: 'init',
    params: [ 'name', 'action' ],
    expect: { '': {} }
});

return baseclass.extend({

    /**
     * Issue or cancel a temporary internet access ticket for a firewall rule.
     *
     * When issuing: sets ac_suspend expiry timestamp and disables the block rule.
     * When cancelling: removes ac_suspend and restores the rule's enabled state.
     *
     * After modifying UCI state:
     *   1. uci.save()        - flushes in-memory changes via ubus uci.set/add/delete
     *   2. callUciCommit()   - writes the staging area to /etc/config/firewall on disk
     *   3. firewall restart  - reloads nftables rules immediately
     *   4. inetac restart    - restarts the ticket expiry daemon
     *
     * @param {string} section_id  - UCI section ID of the firewall rule
     * @param {boolean} cancel     - true to cancel an existing ticket, false to issue
     * @param {number} duration    - ticket duration in minutes (used when issuing)
     * @returns {Promise}
     */
    issueTicket: function(section_id, cancel, duration) {
        if (cancel) {
            uci.remove('firewall', section_id, 'ac_suspend');
            var ac_enabled = uci.get('firewall', section_id, 'ac_enabled');
            uci.set('firewall', section_id, 'enabled', ac_enabled === '1' ? '1' : '0');
        } else {
            var expiry = Math.floor(Date.now() / 1000) + (duration || 60) * 60;
            uci.set('firewall', section_id, 'ac_suspend', String(expiry));
            uci.set('firewall', section_id, 'enabled', '0');
        }

        return uci.save()
            .then(function() {
                return callUciCommit('firewall');
            })
            .then(function() {
                return callServiceRestart('firewall', 'restart');
            })
            .then(function() {
                return callServiceRestart('inetac', 'restart');
            });
    },

    /**
     * Check if a ticket is currently active and not expired for a given section.
     *
     * @param {string} section_id - UCI section ID
     * @returns {number|null} expiry timestamp if ticket is active, null otherwise
     */
    getActiveTicketExpiry: function(section_id) {
        var ac_susp = uci.get('firewall', section_id, 'ac_suspend');
        if (!ac_susp) return null;
        var expiry = parseInt(ac_susp, 10);
        var now = Math.floor(Date.now() / 1000);
        return (now < expiry) ? expiry : null;
    }
});
