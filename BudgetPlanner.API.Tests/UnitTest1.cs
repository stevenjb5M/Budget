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
}
