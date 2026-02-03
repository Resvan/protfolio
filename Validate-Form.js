$(document).ready(function () {

  // Letters only validator
  $.validator.addMethod(
    "lettersonly",
    function (value, element) {
      return this.optional(element) || /^[a-zA-Z ]+$/.test(value.trim());
    },
    "Letters only please"
  );

  // Trimmed minlength validator
  $.validator.addMethod(
    "minlengthTrim",
    function (value, element, min) {
      return this.optional(element) || value.trim().length >= min;
    },
    "Too short"
  );

  $("#contactForm").validate({
    rules: {
      name: {
        required: true,
        lettersonly: true,
        minlengthTrim: 5,
        maxlength: 20,
      },
      email: {
        required: true,
        email: true,
      },
      contact: {
        required: true,
        digits: true,
        minlength: 10,
        maxlength: 10,
      },
      message: {
        required: true,
        minlengthTrim: 10,
        maxlength: 200,
      },
    },

    messages: {
      name: {
        required: "Please enter your full name",
      },
      email: {
        required: "Email is required",
        email: "Please enter a valid email",
      },
      contact: {
        required: "Contact number is required",
        minlength: "Enter a valid 10-digit number",
        maxlength: "Enter a valid 10-digit number",
      },
      message: {
        minlengthTrim: "Message must be at least 10 characters",
        maxlength: "Message is too long",
      },
    },

    submitHandler: function (form) {
      sendContactForm(form);
    },
  });
});

// ---- AJAX SUBMIT ----
function sendContactForm(form) {
  const $form = $(form);
  const $button = $("#submitButton");
  const $status = $("#formStatus");

  // Honeypot check
  if ($form.find('input[name="website"]').val()) {
    return;
  }

  $button.prop("disabled", true).text("Sending...");
  $status.hide();

  $.ajax({
    url: "https://script.google.com/macros/s/AKfycbybAcL6-rBw1kTslaCFrMA9xvr20ntQSUjv6aWC1Z56OdliLyh2frW3GQnUrIM27aSDRQ/exec",
    method: "POST",
    data: $form.serialize(),
    success: function () {
      $form.trigger("reset");
      $status
        .text("✅ Message sent successfully!")
        .css("color", "green")
        .show();
    },
    error: function () {
      $status
        .text("❌ Something went wrong. Please try again.")
        .css("color", "red")
        .show();
    },
    complete: function () {
      $button.prop("disabled", false).text("Send Message");
    },
  });
}
