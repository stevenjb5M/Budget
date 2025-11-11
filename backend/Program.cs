using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.Extensions.NETCore.Setup;
using BudgetPlanner.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure AWS
builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonDynamoDB>();

// Configure DynamoDB context
builder.Services.AddSingleton<IDynamoDBContext>(sp =>
{
    var config = new DynamoDBContextConfig
    {
        TableNamePrefix = builder.Configuration["DynamoDB:TablePrefix"] ?? "BudgetPlanner-",
        Conversion = DynamoDBEntryConversion.V2
    };
    return new DynamoDBContext(sp.GetRequiredService<IAmazonDynamoDB>(), config);
});

// Register DynamoDB service
builder.Services.AddScoped<IDynamoDBService, DynamoDBService>();

// Add authentication
var authority = builder.Configuration["Cognito:Authority"];
var clientId = builder.Configuration["Cognito:ClientId"];

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.Audience = clientId;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                // AWS Cognito will handle key resolution
                return new List<SecurityKey>();
            }
        };
    });

// Add controllers
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        Description = "Enter your JWT token"
    });
    
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
