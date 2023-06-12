$(function () {
    $('#login-form').submit(function (event) {
        event.preventDefault();

        let username = $('#username').val(),
            password = $('#password').val()

        $.ajax({
            type: 'POST',
            url: '/user/login',
            data: JSON.stringify({
                username: username,
                password: password
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                alert('Login successful!');
                window.localStorage.setItem('current_user', JSON.stringify(response.user))
                window.localStorage.setItem('is_logged_in', response.isLoggedIn)
                window.location.href = '/index'
            },
            error: function (xhr, status, error) {
                console.log(xhr.responseText)
                alert('Login failed. Please try again.');
            }
        });
    })
})