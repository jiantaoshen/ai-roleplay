using AiRoleplay.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "Frontend",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            }
        );
    }
);

builder.Services.AddHttpClient<IAiService,AiService>(
    client =>
    {
        client.BaseAddress =
            new Uri(
                "http://127.0.0.1:8000/"
            );

        client.Timeout =
            Timeout.InfiniteTimeSpan;
    }
);

var app = builder.Build();

app.UseCors("Frontend");

app.MapControllers();

app.Run();