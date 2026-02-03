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
      // ✅ NORMAL FORM SUBMIT (NO AJAX)
      $("#submitButton").prop("disabled", true).text("Sending...");
      form.submit();
    },
  });

});

/* ---- SUCCESS HANDLER (Hidden iframe load) ---- */
window.addEventListener("load", function () {
  const iframe = document.querySelector('iframe[name="hidden_iframe"]');
  if (!iframe) return;

  iframe.addEventListener("load", function () {
    $("#contactForm")[0].reset();
    $("#submitButton").prop("disabled", false).text("Send Message");

    $("#formStatus")
      .text("✅ Message sent successfully!")
      .css("color", "green")
      .show();
  });
});
