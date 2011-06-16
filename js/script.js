/*
 * Each skill is represented by a list of display name, code name, and an
 * optional boolean indicating whether or not this is a leveled skill.
 */
var skillsets = {
    'warrior': [
        ['Shield parry', 'shieldparry'],
        ['Bash', 'bash'],
        ['Kick', 'kick'],
        ['Charge', 'charge'],
        ['Rescue', 'rescue'],
        ['Long blades', 'longblades'],
        ['Medium blades', 'mediumblades'],
        ['Fencing blades', 'fencingblades'],
        ['Staves', 'staves'],
        ['Spears', 'spears'],
        ['Polearms', 'polearms'],
        ['Javelins', 'javelins'],
        ['Clubs', 'clubs'],
        ['Axes', 'axes'],
        ['Chains', 'chains']
    ],

    'rogue': [
        ['Palm', 'palm'],
        ['Steal', 'steal'],
        ['Dodge', 'dodge'],
        ['Hide', 'hide'],
        ['Short blades', 'shortblades'],
        ['Sneak', 'sneak'],
        ['Backstab', 'backstab'],
        ['Attack', 'attack'],
        ['Pick', 'pick'],
        ['Projectiles', 'projectiles']
    ],

    'hunter': [
        ['Search', 'search'],
        ['Ride', 'ride', true],
        ['Track', 'track'],
        ['Notice', 'notice'],
        ['Swim', 'swim'],
        ['Ranger sneak', 'rangersneak'],
        ['Wisdom Lore', 'wisdomlore', true],
        ['Survival', 'survival', true]
    ]
};


function build_skill_tables() {
    // builds out the actual HTML for the skill tables
    $.each(skillsets, function(cls, skillset) {
        console.log('Building table for ' + cls);
        //
        // get a reference to the table for this skillset
        var $table = $('#' + cls + '_skills');
        var $tbody = $table.find('tbody');

        $.each(skillset, function(i, skill) {
            // for each skill, insert a row into the table
            var $row = $("<tr data-skill='"+skill[1]+"'>");
            $row.append("<td class='skill-name'>" + skill[0] + "</td>");
            $row.append("<td class='skill-percent'><span>0</span>%</td>");
            $row.append("<td class='skill-sessions'><input value='0'></td>");
            $tbody.append($row);
        });
    });

    console.log('Done building skill tables.');
}


function register_events() {
    console.log('Registering events.');

    // bind the change event for all of the practice inputs
    $('#skill_tables').delegate(
        "td.skill-sessions input",
        "change",
        function() {
            var code = $(this).parents('tr').data('skill');
            console.log(code + ' changed.');
        }
    );

    // bind up/down +/- in practice inputs to increment/decrement
    // the value
    $('#skill_tables').delegate(
        'td.skill-sessions input',
        'keydown',
        function(evt) {
            console.log('Key: ' + evt.which + ';shift=' + evt.shiftKey);
            /*
             * left: 37
             * up: 38
             * right: 39
             * down: 40
             * numpad plus: 107
             * numpad minus: 109
             * plus: 187 + shift
             * minus: 189
             */

            // if the pressed key is delete, backspace, or a number key
            // then let it through so they can do what they want
            if(evt.which == 8 || // backspace
               evt.which == 46 || // delete
               (evt.which >= 96 && evt.which <= 105) || // numpad numbers
               (evt.which >= 48 && evt.which <= 57)) { // regular numbers

                return;
            }

            // disable the default keydown handling
            // unless it's tab
            if(evt.which != 9) {
                evt.preventDefault();
            }

            var v = parseInt($(this).val(), 10) || 0;

            // decrement on left, down, or minus
            if(evt.which == 37 || evt.which == 40 || evt.which == 189 || evt.which == 109) {
                v -= 1;
            }

            // increment on right, up, or plus
            if(evt.which == 39 || evt.which == 38 || evt.which == 107 || (evt.which == 187 && evt.shiftKey)) {
                v += 1;
            }

            // make sure the value is 0 at a minimum
            v = Math.max(v, 0);

            // set the new value
            $(this).val(v);

            // and fire the change event
            $(this).change();

        }
    );

}


$(function() {
    register_events();
    build_skill_tables();
});
