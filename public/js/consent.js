$consents = {};
$schema = undefined;

// listen to data inclusion/exclusion
$('div.form-check > :checkbox').change(function () {
    $consents[$(this).parent().attr("id")].permission.include[this.id] = this.checked;
});
// listen to purpose inclusion/exclusion
$('label.switch > :checkbox').change(function () {
    $consents[this.id].accepted = this.checked;
});

function postSubmit(transaction_id, consents) {
    $.ajax({
        type: 'POST',
        url: '/consent/authorization/data',
        data: JSON.stringify({ allow: true, transaction_id, consents }),
        contentType: 'application/json',
        success: function (result) {
            $('#authorization').append("<input type='hidden' name='success' value='ok'/>");
            $('#authorization').submit();
        }
    });
}

$(function () {
    $schema = $('body').data('schema');

    for (let permission of $schema.permissions) {
        $consents[permission.id] = { permission, accepted: false };
        $consents[permission.id].permission.include = [];
        for (let item of $consents[permission.id].permission.group) {
            $consents[permission.id].permission.include.push(true);
        }
    }
    $('#authorization').submit(function (e) {
        if ($('#authorization input[name="success"]').val() == "ok") {
            return;
        }
        e.preventDefault();
        postSubmit($('#authorization input[name="transaction_id"]').val(), $consents);
    });
});