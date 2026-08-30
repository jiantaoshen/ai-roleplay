import type { Character } from "../types/chat";

type Props = {
  characters: Character[];
  selectedCharacter: Character;
  selectedCharacterId: string;
  isGenerating: boolean;
  onCharacterChange: (characterId: string) => void;
};

function CharacterHeader({
  characters,
  selectedCharacter,
  selectedCharacterId,
  isGenerating,
  onCharacterChange,
}: Props) {
  return (
    <header className="chat-header">
      <div className="character-avatar">
        {selectedCharacter.name.slice(0, 1)}
      </div>

      <div className="min-w-0">
        <h1 className="character-name">
          {selectedCharacter.name}
        </h1>

        <p className="character-meta">
          {selectedCharacter.occupation}
        </p>
      </div>

      <select
        value={selectedCharacterId}
        onChange={(event) => onCharacterChange(event.target.value)}
        disabled={isGenerating}
        className="character-select ml-auto"
      >
        {characters.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}
      </select>
    </header>
  );
}

export default CharacterHeader;