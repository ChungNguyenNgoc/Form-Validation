
// Đối tượng "Validator"
function Validator(options) {
    function getParent(element, selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // Hàm thực hiện validate 
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;

        // Lấy ra các rule của selector
        var rules = selectorRules[rule.selector];
        
        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi thì dừng việc tìm kiếm
        for(var i = 0; i < rules.length; i++) {
            switch(inputElement.type) {
                case "radio":
                case "checkbox":
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ":checked")
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if(errorMessage) break;
        }

        if(errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add("invalid");
        }
        else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
        }

        return !errorMessage; // true or false
    }
    
    
    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    if(formElement) {
        formElement.onsubmit = function(e) {
            e.preventDefault(); // Bỏ đi hành vi mặc định "onsubmit"

            var isFormValid = true;
            // Lặp qua từng rules và validate
            options.rules.forEach(function(rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if(!isValid) {
                    isFormValid = false;
                }
            });

            if(isFormValid) {
                // Trường hợp submit với Javascript
                if(typeof options.onSubmit === "function") {
                    var enableInputs = formElement.querySelectorAll("[name]");
                    // enableInputs đang là NodeList sẽ được convert(chuyển đổi) thành mảng
                    // rồi tiếp tục reduce() để lấy tất cả value của enableInputs
                    // nhận về values và input, giá trị khỏi tạo của initial là {}
                    var formValues = Array.from(enableInputs).reduce(function(values, input){
                        switch(input.type) {
                            case "radio":
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case "checkbox":
                                if(!input.matches(":checked")) {
                                    return values;
                                }
                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case "file":
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    options.onSubmit(formValues);
                }
                // Trường hợp submit với hành vi mặc định của trình duyệt
                else {
                    formElement.submit();
                }
            }
        }

        // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện)
        options.rules.forEach(function(rule) {
            // Lữu lại các rules cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } 
            else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function(inputElement) {
                // Xử lý trường hợp khi blur khỏi input
                inputElement.onblur = function() {
                    validate(inputElement, rule);
                }

                // Xử lý khi người dùng nhập vao input
                inputElement.onclick = function() {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
                }
            });
        });
    }
}

// Định nghĩa rules 
// Nguyên tắc của các rules
// 1. Khi có lỗi => trả ra message lỗi
// 2. Khi hợp lệ => không trả ra cái gì cả (undefined)
// trim(): để loại bỏ tất cả dấu space (trường hợp user nhập vào toàn dấu space)
Validator.isRequired = function(selector) {
    return {
        selector: selector,
        test: function(value) {
            return value ? undefined : `Vui lòng nhập trường này`;
        }
    };
}

Validator.isEmail = function(selector) {
    return {
        selector: selector,
        test: function(value) {
            var regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(value) ? undefined : `Trường này phải là email`;
        }
    };
}

Validator.isPhone = function(selector) {
    return {
        selector: selector,
        test: function(value) {
            var regex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;
            return regex.test(value) ? undefined : `Số điện thoại không hợp lệ`;
        }
    };
}

Validator.minLength = function(selector, min) {
    return {
        selector: selector,
        test: function(value) {
            return value.length >= min ? undefined : `Mật khẩu tối thiểu ${min} ký tự`;
        }
    };
}

Validator.isConfirmed = function(selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function(value) {
            return value === getConfirmValue() ? undefined : message || `Dữ liệu nhập vào không đúng`;
        }
    }
}

