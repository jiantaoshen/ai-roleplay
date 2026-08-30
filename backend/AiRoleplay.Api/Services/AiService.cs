using System.Text;
using System.Text.Json;
using AiRoleplay.Api.Models;

namespace AiRoleplay.Api.Services;

public class AiService : IAiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AiService> _logger;

    private static readonly JsonSerializerOptions JsonOptions =
        new()
        {
            PropertyNameCaseInsensitive = true
        };

    public AiService(
        HttpClient httpClient,
        ILogger<AiService> logger
    )
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CharacterDto>> GetCharactersAsync(
        CancellationToken cancellationToken
    )
    {
        _logger.LogInformation(
            "Requesting characters from AI service"
        );

        using var response =
            await _httpClient.GetAsync(
                "characters",
                cancellationToken
            );

        if (!response.IsSuccessStatusCode)
        {
            var error =
                await response.Content.ReadAsStringAsync(
                    cancellationToken
                );

            _logger.LogError(
                "AI service returned {StatusCode} while loading characters: {Error}",
                response.StatusCode,
                error
            );

            throw new HttpRequestException(
                $"AI service returned {(int)response.StatusCode}: {error}"
            );
        }

        await using var stream =
            await response.Content.ReadAsStreamAsync(
                cancellationToken
            );

        var characters =
            await JsonSerializer.DeserializeAsync<
                List<CharacterDto>
            >(
                stream,
                JsonOptions,
                cancellationToken
            );

        return characters ?? [];
    }

    public async Task StreamChatAsync(
        ChatRequest request,
        Stream outputStream,
        CancellationToken cancellationToken
    )
    {
        _logger.LogInformation(
            "Sending chat request for character {CharacterId} with {MessageCount} messages",
            request.CharacterId,
            request.Messages.Count
        );

        var payload = new
        {
            character_id =
                request.CharacterId,

            messages =
                request.Messages.Select(
                    message => new
                    {
                        role =
                            message.Role,

                        content =
                            message.Content
                    }
                )
        };

        var json =
            JsonSerializer.Serialize(
                payload
            );

        using var httpRequest =
            new HttpRequestMessage(
                HttpMethod.Post,
                "chat/stream"
            );

        httpRequest.Content =
            new StringContent(
                json,
                Encoding.UTF8,
                "application/json"
            );

        using var response =
            await _httpClient.SendAsync(
                httpRequest,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken
            );

        if (!response.IsSuccessStatusCode)
        {
            var error =
                await response.Content.ReadAsStringAsync(
                    cancellationToken
                );

            _logger.LogError(
                "AI service returned {StatusCode}: {Error}",
                response.StatusCode,
                error
            );

            throw new HttpRequestException(
                $"AI service returned {(int)response.StatusCode}: {error}"
            );
        }

        await using var aiStream =
            await response.Content.ReadAsStreamAsync(
                cancellationToken
            );

        var buffer =
            new byte[1024];

        while (true)
        {
            var bytesRead =
                await aiStream.ReadAsync(
                    buffer.AsMemory(),
                    cancellationToken
                );

            if (bytesRead == 0)
            {
                break;
            }

            await outputStream.WriteAsync(
                buffer.AsMemory(
                    0,
                    bytesRead
                ),
                cancellationToken
            );

            await outputStream.FlushAsync(
                cancellationToken
            );
        }

        _logger.LogInformation(
            "AI stream completed for character {CharacterId}",
            request.CharacterId
        );
    }
}