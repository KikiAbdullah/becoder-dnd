import { CharacterId, PlayerData } from '../../types/game';
import characterTemplates from '../../../docs/CHARACTER_TEMPLATES.json';

interface CharacterTemplate {
  class_id: string;
  class_name: string;
  description: string;
  base_stats: { hp: number; armor_class: number; initiative_modifier: number };
  ability_scores: {
    strength: number; dexterity: number; constitution: number;
    intelligence: number; wisdom: number; charisma: number;
  };
  modifiers: {
    str_mod: number; dex_mod: number; con_mod: number;
    int_mod: number; wis_mod: number; cha_mod: number;
  };
  color: string;
  icon: string;
}

export function getCharacterTemplate(classId: CharacterId): CharacterTemplate | null {
  const templates = characterTemplates.characters as CharacterTemplate[];
  return templates.find((c) => c.class_id === classId) ?? null;
}

export function getAllCharacters(): CharacterTemplate[] {
  return characterTemplates.characters as CharacterTemplate[];
}

export function buildPlayerData(
  playerId: string,
  name: string,
  classId: CharacterId
): PlayerData {
  const tpl = getCharacterTemplate(classId);
  if (!tpl) throw new Error(`Character template not found: ${classId}`);

  return {
    playerId,
    name,
    class: classId,
    hp: tpl.base_stats.hp,
    maxHp: tpl.base_stats.hp,
    status: 'active',
    ac: tpl.base_stats.armor_class,
    abilityScores: tpl.ability_scores,
    modifiers: tpl.modifiers
  };
}
