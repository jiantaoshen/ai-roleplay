using Microsoft.AspNetCore.Mvc;

namespace AiRoleplay.Api.Controllers;

[ApiController]
[Route("api/characters")]
public class CharactersController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public CharactersController(
        IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpGet]
    public async Task<IActionResult> GetCharacters(
        CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync(
            "http://127.0.0.1:8000/characters",
            cancellationToken
        );

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(
            cancellationToken
        );

        return Content(
            json,
            "application/json"
        );
    }
}