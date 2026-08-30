using AiRoleplay.Api.Models;

namespace AiRoleplay.Api.Services;

public interface IAiService
{
    Task<IReadOnlyList<CharacterDto>> GetCharactersAsync(
        CancellationToken cancellationToken
    );

    Task StreamChatAsync(
        ChatRequest request,
        Stream outputStream,
        CancellationToken cancellationToken
    );
}