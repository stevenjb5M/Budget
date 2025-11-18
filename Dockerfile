# Use the official .NET 9.0 runtime image as the base image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Use the official .NET 9.0 SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["backend/BudgetPlanner.API.csproj", "backend/"]
RUN dotnet restore "backend/BudgetPlanner.API.csproj"

# Copy the entire source code
COPY . .

# Build the application
WORKDIR "/src/backend"
RUN dotnet build "BudgetPlanner.API.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "BudgetPlanner.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Create the final runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BudgetPlanner.API.dll"]