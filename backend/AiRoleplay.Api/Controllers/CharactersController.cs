using AiRoleplay.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiRoleplay.Api.Controllers;

[ApiController]
[Route("api/characters")]
public class CharactersController : ControllerBase
{
    private readonly IAiService _aiService;

    public CharactersController(
        IAiService aiService
    )
    {
        _aiService = aiService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCharacters(
        CancellationToken cancellationToken
    )
    {
        var characters =
            await _aiService.GetCharactersAsync(
                cancellationToken
            );

        return Ok(
            characters
        );
    }
}