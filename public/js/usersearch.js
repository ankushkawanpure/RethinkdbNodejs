/**
 * Created by Ankush on 6/20/16.
 */
$(document).ready(function () {


    //$.getJSON('/usermail-api', printTerms);

    $('form').submit(function (e) {
        e.preventDefault();
        $.ajax({
            url: '/usersearch-api/' + $('#email').val(),
            type: 'DELETE',
            success: printTerms
        });

        // $.post('/usersearch-api', {email: $('#email').val()}, printTerms);
        this.reset();
    });
});

function printTerms(terms) {
    $('body>dl').empty();
    $.each(terms, function () {
        $('<dt>').text(this.user).appendTo('body>dl');
        $('<dd>').text(this.email).appendTo('body>dl');
    });
    $('dt').off('dblclick').dblclick(function() {
        $.ajax({
            url: '/usermail-api/' + $(this).text(),
            type: 'DELETE',
            success: printTerms
        });
    });
}
