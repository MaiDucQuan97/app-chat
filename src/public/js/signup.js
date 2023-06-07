$(function () {
    $('#signup-form').submit(function (event) {
        event.preventDefault();

        let username = $('#username').val(),
            email = $('#email').val(),
            password = $('#password').val(),
            confirmPassword = $('#confirm-password').val()

        if (password !== confirmPassword) {
            alert('Password and confirm password do not match.');
            return;
        }

        $.ajax({
            type: 'POST',
            url: '/user/create',
            data: JSON.stringify({
                username: username,
                email: email,
                password: password,
                confirmPassword: confirmPassword
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                console.log(response)
                alert('Signup successful!')
                window.location.href = '/login'
            },
            error: function (xhr, status, error) {
                console.log(xhr.responseText)
                alert('Signup failed. Please try again.')
            }
        });
    })
})