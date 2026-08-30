using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace AiRoleplay.Api.Controllers;


[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ChatController> _logger;


    public ChatController(IHttpClientFactory httpClientFactory,ILogger<ChatController> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;
    }


    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok("ASP.NET works");
    }


    [HttpPost("stream")]
    public async Task Stream(
        [FromBody] ChatRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "ASP.NET received {Count} messages",
            request.Messages.Count
        );


        var json = JsonSerializer.Serialize(
        new
            {
                character_id = request.CharacterId,

                messages = request.Messages.Select(
                    message => new
                    {
                        role = message.Role,
                        content = message.Content
                    }
                )
            }
        );


        _logger.LogInformation(
            "Sending to FastAPI: {Json}",
            json
        );


        using var httpRequest = new HttpRequestMessage(
            HttpMethod.Post,
            "http://127.0.0.1:8000/chat/stream"
        );


        httpRequest.Content = new StringContent(
            json,
            Encoding.UTF8,
            "application/json"
        );


        using var aiResponse =
            await _httpClient.SendAsync(
                httpRequest,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken
            );


        _logger.LogInformation(
            "FastAPI responded with {StatusCode}",
            aiResponse.StatusCode
        );


        if (!aiResponse.IsSuccessStatusCode)
        {
            var error =
                await aiResponse.Content.ReadAsStringAsync(
                    cancellationToken
                );

            _logger.LogError(
                "FastAPI error: {Error}",
                error
            );

            throw new HttpRequestException(
                $"FastAPI returned {(int)aiResponse.StatusCode}: {error}"
            );
        }


        Response.StatusCode =
            StatusCodes.Status200OK;

        Response.ContentType =
            "text/plain; charset=utf-8";


        await using var stream =
            await aiResponse.Content.ReadAsStreamAsync(
                cancellationToken
            );


        var buffer = new byte[256];


        while (true)
        {
            var bytesRead =
                await stream.ReadAsync(
                    buffer.AsMemory(),
                    cancellationToken
                );


            if (bytesRead == 0)
            {
                break;
            }


            await Response.Body.WriteAsync(
                buffer.AsMemory(0, bytesRead),
                cancellationToken
            );


            await Response.Body.FlushAsync(
                cancellationToken
            );
        }


        _logger.LogInformation(
            "Stream completed"
        );
    }
}


public record ChatMessage(
    string Role,
    string Content
);

public record ChatRequest(
    string CharacterId,
    List<ChatMessage> Messages
);