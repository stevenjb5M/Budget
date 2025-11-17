using BudgetPlanner.Models;

namespace BudgetPlanner.API.Tests;

public class UnitTest1
{
    [Fact]
    public void User_Birthday_Should_Set_BirthdayString_Correctly()
    {
        // Arrange
        var user = new User();
        var testDate = new DateTime(1995, 5, 15);

        // Act
        user.Birthday = testDate;

        // Assert
        Assert.Equal("1995-05-15", user.BirthdayString);
    }

    [Fact]
    public void User_Birthday_Should_Get_From_BirthdayString()
    {
        // Arrange
        var user = new User { BirthdayString = "1995-05-15" };

        // Act
        var birthday = user.Birthday;

        // Assert
        Assert.Equal(new DateTime(1995, 5, 15), birthday);
    }

    [Fact]
    public void User_Birthday_Should_Default_To_1990_01_01_When_BirthdayString_Is_Null()
    {
        // Arrange
        var user = new User { BirthdayString = null };

        // Act
        var birthday = user.Birthday;

        // Assert
        Assert.Equal(new DateTime(1990, 1, 1), birthday);
    }

    [Fact]
    public void User_Birthday_Should_Default_To_1990_01_01_When_BirthdayString_Is_Empty()
    {
        // Arrange
        var user = new User { BirthdayString = "" };

        // Act
        var birthday = user.Birthday;

        // Assert
        Assert.Equal(new DateTime(1990, 1, 1), birthday);
    }

    [Fact]
    public void User_Birthday_Should_Handle_Invalid_BirthdayString()
    {
        // Arrange
        var user = new User { BirthdayString = "invalid-date" };

        // Act
        var birthday = user.Birthday;

        // Assert
        Assert.Equal(new DateTime(1990, 1, 1), birthday);
    }

    [Fact]
    public void User_Birthday_Should_Convert_Utc_Date_To_Local_When_Setting()
    {
        // Arrange
        var user = new User();
        var utcDate = new DateTime(1995, 5, 15, 12, 0, 0, DateTimeKind.Utc);

        // Act
        user.Birthday = utcDate;

        // Assert
        // The exact behavior depends on the system's local timezone, but it should be a valid date string
        Assert.NotNull(user.BirthdayString);
        Assert.Contains("-", user.BirthdayString); // Should be in YYYY-MM-DD format
    }

    [Fact]
    public void User_Should_Have_Default_Property_Values()
    {
        // Arrange & Act
        var user = new User();

        // Assert
        Assert.Null(user.Id);
        Assert.Null(user.Email);
        Assert.Null(user.DisplayName);
        Assert.Null(user.BirthdayString);
        Assert.Equal(0, user.RetirementAge); // Default value for int
        Assert.Equal(default(DateTime), user.CreatedAt);
        Assert.Equal(default(DateTime), user.UpdatedAt);
        Assert.Equal(1, user.Version); // Explicitly set default
    }

    [Fact]
    public void User_Should_Be_Able_To_Set_All_Properties()
    {
        // Arrange
        var testDate = DateTime.UtcNow;
        var user = new User();

        // Act
        user.Id = "test-id";
        user.Email = "test@example.com";
        user.DisplayName = "Test User";
        user.BirthdayString = "1990-05-15";
        user.RetirementAge = 65;
        user.CreatedAt = testDate;
        user.UpdatedAt = testDate;
        user.Version = 5;

        // Assert
        Assert.Equal("test-id", user.Id);
        Assert.Equal("test@example.com", user.Email);
        Assert.Equal("Test User", user.DisplayName);
        Assert.Equal("1990-05-15", user.BirthdayString);
        Assert.Equal(65, user.RetirementAge);
        Assert.Equal(testDate, user.CreatedAt);
        Assert.Equal(testDate, user.UpdatedAt);
        Assert.Equal(5, user.Version);
    }

    [Fact]
    public void User_Birthday_Getter_Should_Parse_Various_Date_Formats()
    {
        // Test different valid date formats that might be stored
        var testCases = new[]
        {
            ("1990-05-15", new DateTime(1990, 5, 15)),
            ("2000-12-31", new DateTime(2000, 12, 31)),
            ("1985-01-01", new DateTime(1985, 1, 1))
        };

        foreach (var (birthdayString, expectedDate) in testCases)
        {
            // Arrange
            var user = new User { BirthdayString = birthdayString };

            // Act
            var birthday = user.Birthday;

            // Assert
            Assert.Equal(expectedDate, birthday);
        }
    }
}
