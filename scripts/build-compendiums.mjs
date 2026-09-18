import fs from "node:fs";
import path from "node:path";
import * as crypto from "node:crypto";

const MODULE_ID = "sw-mystic-psionics";
const OUT = "build";

const groups = [
  ["Root","Psychometabolic","science",3,["Animal Affinity","Complete Healing","Energy Control","Etherealness","Life Draining","Shadow Form","Shape Alteration"]],
  ["Root","Psychometabolic","devotion",1,["Absorption","Adrenaline Control","Biofeedback","Body Control","Body Equilibrium","Body Weaponry","Cell Adjustment","Chameleon Ability","Expansion","Mind Over Body","Reduction","Suspend Animation"]],
  ["Sacral","Clairsentient","science",3,["Aura Sight","Catacognition","Hypercognition","Precognition","Psionic Divination","Psionic True Seeing","Sensitivity to Psychic Impressions"]],
  ["Sacral","Clairsentient","devotion",1,["360° Vision","Clairaudience","Clairvoyance","Danger Sense","Detection of Good/Evil","Detection of Magic","Infravision","Know Direction","Know Location","Object Reading","Poison Sense","Spirit Sense"]],
  ["Plexus","Psychokinetic","science",3,["Create Object","Detonate","Disintegrate","Molecular Manipulation","Molecular Rearrangement","Project Force","Telekinesis"]],
  ["Plexus","Psychokinetic","devotion",1,["Animate Object","Animate Shadow","Control Body","Control Flames","Control Light","Control Sound","Control Temperature","Control Wind","Disrupt Invisibility","Inertial Barrier","Levitation","Molecular Agitation"]],
  ["Heart","Telepathic","science",3,["Mass Domination","Mind Bar","Mind Link","Mind Wipe","Probe","Speak Any Language","Switch Personality"]],
  ["Heart","Telepathic","devotion",1,["Animal Telepathy","Conceal Thoughts","Domination","Empathy","ESP","Hypnosis","Identity Penetration","Invisibility","Life Detection","Phobia Amplification","Synaptic Static","Telempathic Projection"]],
  ["Throat","Psychoportative","science",3,["Banishment","Dimension Door","Dimension Walk","Probability Travel","Summon Planar Creature","Teleport Other","Teleportation"]],
  ["Throat","Psychoportative","devotion",1,["Astral Projection","Blink","Burst","Catfall","Dimension Slide","Dimension Swap","Dissipating Touch","Dream Travel","Phase Shift","Retrieve","Time Leap","Time/Space Anchor"]],
  ["Third Eye","Metapsionic","science",5,["Empower","Psychic Clone","Psychic Surgery","Retrospection","Schism","Splice","Ultrablast"]],
  ["Third Eye","Metapsionic","devotion",2,["Appraise","Aura Alteration","Cannibalize","Convergence","Enhancement","Magnify","Martial Trance","Psionic Sense","Psychic Drain","Receptacle","Stasis Field","Stretch"]]
];

const attackModes = [
  ["Id Insinuation",4,"180'","Instantaneous","10-foot radius around target","Unleashes unconscious urges. A failed psionic save produces fear, rage, hopelessness, or feeblemindedness for 1d6 rounds plus 1 round per 2 psionic levels."],
  ["Ego Whip",3,"90'","Instantaneous","1 creature","A failed psionic save leaves the target stunned and unable to act for 1d6 rounds plus 1 round per 2 psionic levels."],
  ["Mind Thrust",3,"60'","Instantaneous","1 creature","A failed psionic save confuses the target for 1d6 rounds plus 1 round per 2 psionic levels."],
  ["Psionic Blast",5,"60-foot cone","Instantaneous","Cone","A failed psionic save inflicts 1d6 + 1 hit point per 2 psionic levels and stuns for 1d6 rounds + 1 round per 2 psionic levels."],
  ["Psychic Crush",5,"90'","Instantaneous","1 creature","A failed psionic save inflicts 2d6 + psionic level hit points of damage."]
];

const defenseModes = [
  ["Mind Blank",0,"Self","1 round","Self","+2 against attack modes that cause behavioral effects and reduces the effect of area attacks."],
  ["Thought Shield",2,"Self","1 round","Self","+1 to saves against all attack modes and halves emotion, stun, or confusion effects."],
  ["Mental Barrier",2,"Self","1 round","Self","+3 to saves against area attacks and halves hit point damage from attack modes."],
  ["Intellect Fortress",4,"Self","1 round","10-foot radius","Halves the effect of any psionic attack mode affecting creatures within the protected area."],
  ["Tower of Iron Will",5,"Self","1 round","5-foot radius","+3 to saves against psionic attack modes for creatures within the protected area."]
];

function idFor(prefix, name) {
  return crypto.createHash("sha256").update(prefix + ":" + name).digest("hex").slice(0, 16);
}
function writeDoc(dir, doc) {
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, doc._id + ".json"), JSON.stringify(doc, null, 2));
}
function spellDoc(name, chakra, discipline, category, psp, extra={}) {
  const id = idFor("power", name);
  const typeLabel = category === "science" ? "Major Science" : category === "devotion" ? "Minor Devotion" : category === "attack" ? "Attack Mode" : "Defense Mode";
  const detail = extra.detail ? `<p>${extra.detail}</p>` : `<p>This entry identifies the discipline, chakra, and PSP cost. Full discipline effects follow the PX1 Basic Psionics Handbook rules.</p>`;
  return {
    name, type:"spell", _id:id,
    img:"systems/swords-wizardry/assets/game-icons-net/spell-book.svg",
    system:{
      description:`<h3>${typeLabel}</h3><p><strong>Chakra:</strong> ${chakra}</p><p><strong>Discipline:</strong> ${discipline}</p><p><strong>PSP Cost:</strong> ${psp}</p>${extra.target ? `<p><strong>Target/Area:</strong> ${extra.target}</p>` : ""}${detail}`,
      spellLevel:1, range:extra.range ?? "", duration:extra.duration ?? "", formula:"", effectType:"none", requiresSave:category === "attack", saveEffect:"negate"
    },
    effects:[], sort:0, ownership:{default:0},
    flags:{[MODULE_ID]:{psionic:true,category,chakra,discipline,pspCost:psp,target:extra.target ?? ""}},
    _key:`!items!${id}`
  };
}
function featureDoc(name, description) {
  const id=idFor("feature", name);
  return {name,type:"feature",_id:id,img:"systems/swords-wizardry/assets/game-icons-net/skills.svg",system:{description,formula:"",target:1,targetType:"descending"},effects:[],sort:0,ownership:{default:0},flags:{[MODULE_ID]:{mysticFeature:true}},_key:`!items!${id}`};
}

fs.rmSync(OUT,{recursive:true,force:true});
const powersDir=path.join(OUT,"powers");
const featuresDir=path.join(OUT,"features");
for (const [chakra, discipline, category, psp, names] of groups) for (const name of names) writeDoc(powersDir, spellDoc(name, chakra, discipline, category, psp));
for (const [name,psp,range,duration,target,detail] of attackModes) writeDoc(powersDir, spellDoc(name,"Psionic Combat","Combat Mode","attack",psp,{range,duration,target,detail}));
for (const [name,psp,range,duration,target,detail] of defenseModes) writeDoc(powersDir, spellDoc(name,"Psionic Combat","Combat Mode","defense",psp,{range,duration,target,detail}));

const rows=[[1,5,1,1,3,1,0],[2,10,1,1,5,2,1],[3,15,2,2,7,2,1],[4,20,2,2,9,3,2],[5,25,2,3,10,3,2],[6,30,3,3,11,4,3],[7,35,3,4,12,4,3],[8,40,3,4,13,5,4],[9,45,4,5,14,5,4],[10,50,4,5,15,5,5],[11,55,4,6,16,5,5],[12,60,5,6,17,5,5],[13,65,5,7,18,5,5],[14,70,6,7,19,5,5],[15,75,6,8,20,5,5],[16,80,6,8,21,5,5],[17,85,6,9,22,5,5],[18,90,6,9,23,5,5],[19,95,6,10,24,5,5],[20,100,6,10,25,5,5]];
const progression=`<table><thead><tr><th>Level</th><th>PSP</th><th>Chakras</th><th>Sciences</th><th>Devotions</th><th>Attack</th><th>Defense</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const features=[
 ["Mystic Class",`<p><strong>Prime Attributes:</strong> Intelligence and Wisdom. <strong>Minimum:</strong> INT 9, WIS 9. <strong>Hit Dice:</strong> d4. <strong>Armor:</strong> leather only, no shield. <strong>Weapons:</strong> dagger.</p><p>Either INT or WIS 13+ grants +5% XP; INT 13+ and WIS 16+ grants +10% XP.</p>${progression}`],
 ["Psionic Strength Points",`<p>Mystics gain <strong>5 PSP per psionic level</strong>. Known abilities may be used repeatedly while sufficient PSP remain. After 8 hours of rest followed by about 1 hour of undisturbed meditation, spent PSP are recovered. At 0 PSP all active psionic powers cease except Mind Blank.</p>`],
 ["Psionic Saving Throws",`<p>Use the normal S&amp;W saving throw, modified by Intelligence for psionic effects: INT 3: −3; 4–5: −2; 6–8: −1; 9–12: +0; 13–15: +1; 16–17: +2; 18: +3.</p><p>Wisdom modifies psionic combat damage: WIS 13–15: +1; 16–17: +2; 18: +3. Creatures with INT 2 or less are immune to attack modes.</p>`],
 ["Chakras and Disciplines",`<p>Disciplines are Major Sciences and Minor Devotions. Standard order: Root (Psychometabolic), Sacral (Clairsentient), Plexus (Psychokinetic), Heart (Telepathic), Throat (Psychoportative), Third Eye (Metapsionic).</p><p>Science/Devotion PSP costs are 3/1 for the first five chakras and 5/2 for Third Eye.</p>`],
 ["Concentration and Simultaneous Powers",`<p>Most disciplines require complete concentration during the first round. Powers requiring continuing concentration end if concentration is broken. The total PSP cost of simultaneously active abilities may not exceed <strong>psionic level + 3</strong>; defense modes do not count. Only one concentration-requiring psionic ability may be used in a round.</p>`],
 ["Psionic Combat",`<p>A Mystic may use no more than one Attack Mode and one Defense Mode per round. Attack modes require concentration and prevent movement or other actions that round. Defense modes are declared before initiative and do not prevent normal actions.</p><p>Psionic targets failing a save also lose 1d6 PSP + 1 PSP per 2 psionic levels of the attacker. At 0 PSP, further PSP loss becomes hit point loss.</p>`],
 ["Non-Possessiveness",`<p>Mystics practice detachment from material wealth. In this campaign this is a class ideal: wealth needed for survival, adventuring, research, followers, or legitimate domain responsibilities is acceptable; hoarding wealth for personal luxury violates the ideal.</p>`],
 ["Ashram",`<p>At 9th level a Mystic may establish an ashram or similar sanctuary. Once established, one 1st- or 2nd-level Mystic may arrive each month until followers equal the Mystic's Charisma. The Mystic must spend at least 10 hours per week training them.</p>`]
];
for (const [name,desc] of features) writeDoc(featuresDir, featureDoc(name,desc));
console.log(`Built ${fs.readdirSync(powersDir).length} powers and ${fs.readdirSync(featuresDir).length} features.`);
