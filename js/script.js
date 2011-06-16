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

    // bind to the change event on any of the character
    // attribute options
    $("#character_info select").change(function() {
        console.log('Character information changed.');
    });

    // make sure they pick a valid class
    $("#faction").change(function() {
        if($(this).val() != "human") {
            // if they already have channeler selected, move them to
            // warrior
            var cls = $("#class").val();
            if(cls == "channeler") {
                $("#class").val('warrior');
            }

            // be sure to disable channelers
            $("#class option[value='channeler']").attr('disabled', 'disabled');

        } else {
            // re-enable channelers
            $("#class option[value='channeler']").removeAttr('disabled');
        }
    });

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


function skill_level(i) {
    // Returns the skill level given the actual practice amount
    // Each level activates at a multiple of 14.
    return Math.floor(i / 14);
}


function calculate_level(faction, sessions) {
    // Determines the required level based on the number of
    // used practices and the faction of the character.

    // Humans and seachan get 5 pracs per level up to 30
    // Trollocs get 3 per level up to 30
    // All get 2 per level past that and start with 8

    var per_level = 5;
    if(faction == "trolloc") {
        per_level = 3;
    }

    var level = 1;
    var pracs = 8;

    while(pracs < sessions) {
        level++;
        pracs += (level < 30 ? per_level : 2);
    }

    return level;

    // TODO: Move this writing to another place
    $("#required_level").val(level);

}


function increment_skill(current, start) {
    // Returns the next percentage for an arbitrary skill, based
    // on the current percentage and the starting percentage.
    // This is really a function of the starting value.

    var incr = 0;
    if(current <= 20) {
        // up to 20 points, you increment by your starting amount
        // each time
        incr = start;
    } else if(current <= 40) {
        incr = Math.floor(0.8 * start);
    } else if(current <= 60) {
        incr = Math.floor(0.5929 * start);
    } else if(current <= 80) {
        incr = Math.floor(0.4 * start);
    } else if(current <= 90) {
        incr = Math.floor(0.2 * start);
    } else {
        // at 90 and above, it's one point at a time
        incr = 1;
    }

    return current + incr;

}


$(function() {
    register_events();
    build_skill_tables();
});
