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

skillsets.has_levels = function(skill) {
    // returns whether or not the supplied skill is one that
    // gets levels
    var ret = false;
    $.each(skillsets, function(cls, skillset) {
        $.each(skillset, function(i, skill_) {
            if(skill == skill_[1]) {
                if(skill_.length == 3) {
                    ret = skill_[2];
                } else {
                    ret = false;
                }

                return false;
            }
        });
    });

    return ret;

}


function build_skill_tables() {
    // builds out the actual HTML for the skill tables
    $.each(skillsets, function(cls, skillset) {
        // get a reference to the table for this skillset
        var $table = $('#' + cls + '_skills');
        var $tbody = $table.find('tbody');

        $.each(skillset, function(i, skill) {
            // for each skill, insert a row into the table
            var col = i % 2 ? "odd" : "even";
            var $row = $("<tr class='"+col+"' data-skill='"+skill[1]+"'>");
            $row.append("<td class='skill-name'>" + skill[0] + "</td>");

            if(skillsets.has_levels(skill[1])) {
                $row.append("<td class='skill-percent'><span>0</span>% \
                            L<span class='skill-level'>0</span></td>");
            } else {
                $row.append("<td class='skill-percent'><span>0</span>%</td>");
            }

            $row.append("<td class='skill-sessions'><input value='0'></td>");
            $tbody.append($row);
        });
    });
}


function register_events() {
    // bind to the reset link
    $("#reset_link").click(function(evt) {
        // prevent the page from moving
        evt.preventDefault();

        $("#skill_tables td.skill-sessions input").each(function() {
            $(this).val(0);
            $(this).change();
        });

    });
    // bind to the change event on any of the character
    // attribute options
    $("#character_info select").change(function() {
        // when the character info changes, recalculate
        // the required pracs and level
        update_skills();
        update_information();
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
            var skill = $(this).parents('tr').data('skill');
            update_skill(skill);

            // after updating the skill, update the total practices
            // as well as the required level
            update_information();
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

            // set the new value and fire the change event
            $(this).val(v).change();

        }
    );

    $('#skill_tables').delegate(
        'td, input',
        'mousewheel',
        function(evt, delta) {

            // prevent the default event
            evt.preventDefault();

            if($(this).is('input')) {
                // if the mouse is hovering over the input, return here
                // to prevent the handler from running twice.
                // by default, it will bubble up to the cell containing
                // the input, which will handle it.
                return true;
            }

            var $inp = $(this).parents('tr').find('td.skill-sessions input');
            var v = parseInt($inp.val(), 10) || 0;
            var incr = 0;

            if(delta > 0) {
                // scrolling upwards
                incr = 1;
            } else {
                incr = -1;
            }

            v = Math.max(v + incr, 0);

            $inp.val(v).change();

        }
    );

}


function update_information() {
    // Updates the required practices and level information
    // based on current prac usage
    var ch = get_character_info();
    var required_pracs = 0;
    var required_level = 0;

    // get the total number of used sessions, grouped by class
    var sessions = {'warrior': 0, 'rogue': 0, 'hunter': 0};
    $("#skill_tables td.skill-sessions input").each(function() {
        var skill = $(this).parents('tr').data('skill');
        var cls = skillsets.get_class(skill);
        sessions[cls] += parseInt($(this).val());
    });

    // class determines how many practices are used per session in a given
    // class
    // Warriors: 1 3 2
    // Rogues: 3 1 2
    // Hunters: 2 2 1
    // Channelers (female): 4 3 2
    // Channelers (male): 3 3 2

    if(ch.cls == 'warrior') {
        required_pracs = sessions.warrior * 1;
        required_pracs += sessions.rogue * 3;
        required_pracs += sessions.hunter * 2;
    } else if(ch.cls == 'rogue') {
        required_pracs = sessions.warrior * 3;
        required_pracs += sessions.rogue * 1;
        required_pracs += sessions.hunter * 2;
    } else if(ch.cls == 'hunter') {
        required_pracs = sessions.warrior * 2;
        required_pracs += sessions.rogue * 2;
        required_pracs += sessions.hunter * 1;
    } else if(ch.cls == 'channeler' && ch.sex == 'female') {
        required_pracs = sessions.warrior * 4;
        required_pracs += sessions.rogue * 3;
        required_pracs += sessions.hunter * 2;
    } else if(ch.cls == 'channeler' && ch.sex == 'male') {
        required_pracs = sessions.warrior * 3;
        required_pracs += sessions.rogue * 3;
        required_pracs += sessions.hunter * 2;
    }

    $("#required_pracs").html(required_pracs);

    required_level = calculate_required_level(ch.faction, required_pracs);
    $("#required_level").html(required_level);

}


$(function() {
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
 *
 * For now, I'm not handling residuals since the current math seems
 * to be incorrect. The existing prac trainer, that this is based off
 * of, sets the residual amount equal to 40% of the last practiced skill
 * from that skill group, which I really don't think is correct.
 *
 * Questions that need to be answered:
 *  * What happens when you practice long blades to 20%, which gives you
 *      8% in medium blades/fencing blades, and then you practice medium
 *      blades? How does that affect fencing/long blades?
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
        pracs += (level <= 30 ? per_level : 2);
    }

    return level;

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

    // make sure the increment is at least 1 percent
    // not sure it's possible on the MUD, but using
    // these formulae with bad enough stats you can
    // hit a point where a skill will not increase
    incr = Math.max(incr, 1);

    return current + incr;

}


function get_percentage(skill, sessions) {
    // returns the actual percentage based on the number of
    // practice sessions spent
    var start = get_starting_percentage(skill);
    var perc = 0;

    for(var i = 0; i < sessions; i++) {
        perc = increment_percentage(perc, start);
    }

    return perc;
}


function get_skill_percentage(skill) {
    // Returns the current skill percentage for the given skill
    var sessions = $("#skill_tables tr[data-skill=" + skill + "] input").val();
    return get_percentage(sessions);
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


function update_skill(skill) {
    // get the current skill level
    // FIXME: This shouldn't have to call into the DOM
    var $row = $("#skill_tables tr[data-skill=" + skill + "]");

    var sessions = $row.find('input').val();

    var perc = get_percentage(skill, sessions);
    // if the percentage is over 99, decrease sessions until
    // it's below 99
    if(perc > 99) {
        while((perc = get_percentage(skill, sessions)) > 99) {
            sessions--;
        }
        // set the new number of sessions
        $row.find('input').val(sessions);
    }

    $row.find('.skill-percent span').not('span.skill-level').html(perc);

    // if this is a skill with levels then we should display the level
    var has_levels = skillsets.has_levels(skill);
    if(!has_levels) return;

    var skill_lev = skill_level(perc);
    $row.find('span.skill-level').html(skill_lev);

}


function update_skills() {
    // Runs the update function for all skills
    $("#skill_tables td.skill-sessions input").each(function() {
        var skill = $(this).parents('tr').data('skill');
        update_skill(skill);
    });
}

// }}}

