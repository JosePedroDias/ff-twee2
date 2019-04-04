/*
https://twinery.org/cookbook/
https://dan-q.github.io/twee2/documentation.html
*/

window.setup = window.setup = {};

setup.roll1d6 = () => _.random(1, 6);

setup.roll2d6 = () => _.random(1, 6) + _.random(1, 6);

setup.prepare = (s) => {
  if (s.prepared) {
    return;
  }

  s.prepared = true;

  s.inventory = [];
  s._defeated = [];
  s.defeated = [];

  s.skill = setup.roll1d6() + 6;
  s.stamina = setup.roll2d6() + 12;
  s.luck = setup.roll1d6() + 6;
  s.provisions = 10;

  s.skillMax = s.skill;
  s.staminaMax = s.stamina;
  s.luckMax = s.luck;

  $(document.createElement('div'))
    .attr('id', 'sidebar')
    .insertBefore('#passage');

  function afterShowPassage() {
    $('#sidebar').html(window.story.render('Header'));
  }

  $(window).on('showpassage:after', afterShowPassage);
  afterShowPassage();
  setup.updateStats = afterShowPassage;
};

setup.testSkill = (s) => {
  const v = setup.roll1d6() + setup.roll1d6();
  return v <= s.skill;
};

setup.testLuck = (s) => {
  const v = setup.roll1d6();
  s.wasLucky = v <= s.luck;
  setup.refresh();
  return s.wasLucky;
};

setup.take = (s, item) => {
  if (setup.has(s, item)) {
    return;
  }
  s.inventory.push(item);
  setup.updateStats();
  setup.refresh();
};

setup.has = (s, item) => {
  return s.inventory.indexOf(item) !== -1;
};

setup.drop = (s, item) => {
  if (!setup.has(s, item)) {
    return;
  }
  s.inventory = s.inventory.filter((it) => it !== item);
  setup.updateStats();
  setup.refresh();
};

setup.decrease = (s, attr, n = 1) => {
  if (s[attr] < n) {
    return;
  }
  s[attr] -= n;

  if (attr === 'provisions') {
    s.stamina = Math.min(s.staminaMax, s.stamina + n * 4);
  }

  setup.updateStats();
  setup.refresh();
};

setup.defeated = (s, enemyName, i = 0) => {
  const enemy = s.defeated[s.defeated.length - 1 - i];
  return enemy === enemyName;
};

setup.now = () => {
  const st = window.story;
  return st.passages[st.history[st.history.length - 1]].name;
};

setup.refresh = () => {
  window.story.show(setup.now());
};

setup.prepareFight = (s, enemies, config = {}) => {
  if (s.fight) {
    return;
  }
  if (setup.defeated(s, enemies[0].name)) {
    return;
  }
  s.fight = { enemies, ...config };
};

setup.renderFightRound = (s) => {
  if (s.fight.started) {
    return (
      s.fight.output.join('<br/>') +
      s.fight.actions
        .map((act) => `<a onclick="setup.fightRound(s, '${act}')">${act}</a>`)
        .join(' ')
    );
  } else {
    return '<a onclick="setup.fightRound(s)">fight</a>';
  }
};

setup.fightRound = (s, action) => {
  const f = s.fight;

  function log(msg) {
    msg = msg.replace(/>/g, '&gt;');
    f.output.push(msg);
  }

  function round(enemy) {
    const enemyAttackStrength = setup.roll2d6() + enemy.skill;
    const ourAttackStrength = setup.roll2d6() + s.skill;
    const attacks =
      'enemy:' + enemyAttackStrength + ', we:' + ourAttackStrength;
    if (ourAttackStrength > enemyAttackStrength) {
      log(`  ${attacks} -> you wounded the enemy`);
      enemy.stamina -= 2;
    } else if (enemyAttackStrength > ourAttackStrength) {
      log(`  ${attacks} -> the enemy wounded you`);
      s.stamina -= 2;
    } else {
      log(`  ${attacks} -> draw`);
    }
    setup.updateStats();
    if (s.stamina <= 0) {
      log('game over');
    }

    if (enemy.stamina > 0) {
      round(enemy);
    } else {
      log(enemy.name + ' died');
      s._defeated.push(enemy.name);
      f.actions.push('continue');
    }
  }

  f.actions = [];
  if (!f.started) {
    f.output = [];
    f.started = true;
    f.enemy = f.enemies.shift();
    log(`fighting ${f.enemy.name}`);
    round(f.enemy);
  } else if (action === 'continue') {
    s.defeated = s._defeated;
    s.fight = undefined;
  } else {
    log('?!');
  }
  setup.refresh();
};
