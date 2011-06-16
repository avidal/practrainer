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

skillsets.get_class = function(skill) {
    // returns the class associated with a given skill
    var ret = '';
    $.each(skillsets, function(cls, skillset) {
        $.each(skillset, function(i, skill_) {
            if(skill == skill_[1]) {
                ret = cls;
                return false;
            }
        });
    });

    return ret;
}

var skillgroups = [
    ['longblades', 'mediumblades', 'fencingblades'],
    ['sneak', 'rangersneak']
];

skillgroups.contains = function(skill) {
    // returns a boolean indicating whether or not the passed
    // skill is in a skillgroup
    var yesno = false;
    $.each(skillgroups, function(i, group) {
        yesno = !!$.inArray(group, skill);
        return false;
    });

    return yesno;

}

skillgroups.group = function(skill) {
    // returns the skill group for a given skill
    var group = [];
    $.each(skillgroups, function(i, group_) {
        if($.inArray(skill, group_) >= 0) {
            group = group_;
            return false;
        }
    });

    return group;

}


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
            if(evt.which == 37 || // left
               evt.which == 40 || // down
               evt.which == 189 || // minus (shift+_)
               evt.which == 109) { // numpad minus

                v -= 1;
            }

            // increment on right, up, or plus
            if(evt.which == 39 || // right
                evt.which == 38 || // up
                evt.which == 107 || // numpad plus
                (evt.which == 187 && evt.shiftKey)) { // shift+0

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
    $("#skill_tables").delegate("#warrior_skills input", "change",
        function() {
            warrior_prac($(this).parents('tr').data('skill'));
        }
    );

    register_events();
    build_skill_tables();
});

// HERE BE DRAGONS {{{

/*
 * Skill calculations are based off `route` that is determined by your
 * stats. Each set of skills has a starting value based off of those
 * stats, and each subsequent practice is a function of the previous
 * practice.
 *
 * Warrior skills start at STR / 2 + DEX / 4 + CON / 4
 * Rogue skills start at DEX * 3 / 4 + INT / 4
 * Hunter skills start at (STR + INT + WIL + DEX) / 4
 *
 * On each successive practice session, your percentage in a given
 * skill is incremented based on your current value and starting
 * value.
 *
 * Below 20%, you gain <start> percentage.
 * Below 40%, you gain 80% of <start>.
 * Below 60%, you gain 59.29% of <start>.
 * Below 80%, you gain 40% of <start>.
 * Below 90%, you gain 20% of <start>
 * Above 90, you gain 1 percentage each session.
 *
 * Some skills are related to other skills, and lend residuals to them.
 * Groups:
 *      long blades, medium blades, fencing blades
 *      sneak, ranger sneak
 *
 * All residuals are 40% of each skill in the group, and affect
 * your starting percentage only. This means that having 91%
 * ranger sneak, and then practicing sneak, will not increase your
 * ranger sneak by 40% of your sneak skill.
 */


function skill_level(i) {
    // Returns the skill level given the actual practice amount
    // Each level activates at a multiple of 14.
    return Math.floor(i / 14);
}


function calculate_required_level(faction, sessions) {
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


function get_starting_percentage(skill) {
    // returns the starting percentage for a given skill
    var cls = skillsets.get_class(skill);
    var ch = get_character_info();

    if(cls == 'warrior') {
        return Math.floor(ch.str / 2) +
               Math.floor(ch.dex / 4) +
               Math.floor(ch.con / 4);
    }

    if(cls == 'rogue') {
        return Math.floor(ch.dex * 3 / 4) +
               Math.floor(ch.int / 4);
    }

    if(cls == 'hunter') {
        return Math.floor((ch.str + ch.int + ch.wil + ch.dex) / 4.0)
    }

}


function increment_percentage(current, start) {
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


function get_percentage(sessions) {
    // returns the actual percentage based on the number of
    // practice sessions spent
}


function get_skill_percentage(skill) {
    // Returns the current skill percentage for the given skill
    var sessions = $("#skill_tables tr[data-skill=" + skill + "] input").val();
    return get_percentage(sessions);
}


function get_residuals(skill) {
    // for a given skill, pull down all of the residuals
    var residual = 0;
    var group = [];

    // all residuals are 40% of related skills
    var residual_percent = 0.4;

    // long blades, medium blades, and fencing blades all
    // gain a residuals from any other one of the skills
    if(skill == "longblades" || skill == "mediumblades" || skill == "fencingblades") {
        var group = ['longblades', 'mediumblades', 'fencingblades'];
    }

    var idx = $.inArray(skill, group);
    if(idx !== -1) {
        // remove the current skill from the group
        group = group.slice(idx, idx+1);
    }

    $.each(group, function(i, groupskill) {
        // for each skill in the group, get the percentage
        // and add the residual
        //var skillper += get_skill_percentage(groupskill)
        residual += Math.floor(skillper * residual_percent);
    });

    return residual;
}


function get_character_info() {
    var ch = {}
    ch.sex = $("#sex").val();
    ch.faction = $("#faction").val();
    ch.cls = $("#class").val();

    var stats = ['str', 'int', 'wil', 'dex', 'con'];
    $.each(stats, function(i, stat) {
        ch[stat] = parseInt($("#stats_" + stat).val(), 10);
    });

    return ch;
}


function update_warrior_skill(skill, dir) {
    // get the current skill level
    // FIXME: This shouldn't have to call into the DOM
    var sessions = $("#skill_tables tr[data-skill=" + skill + "] input").val();
    console.log(skill + ": " + current);

    // get the current character information
    var ch = get_character_info();

    // the starting percentage for a warrior skill
    var start = Math.floor(ch.str / 2) +
                Math.floor(ch.dex / 4) +
                Math.floor(ch.con / 4);

    var residual = get_residuals(skill);

}

// }}}

