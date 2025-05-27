const requiredField = (fieldName = 'Field') => (value) => !!value || `${fieldName} is required`;
const minLength = (fieldName = 'Field', min) => (value) => value.length >= min || !value || `${fieldName} must be at least ${min} characters`;
const maxLength = (fieldName = 'Field', max) => (value) => value.length <= max || !value || `${fieldName} must be at most ${max} characters`;
const emailFormat = (fieldName = 'Email') => (value) => !value || value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) || `${fieldName} is invalid`;
const isPositive = (fieldName = 'Field') => (value) => !value || parseFloat(value) > 0 || `${fieldName} must be a positive number`;
const lessThan = (fieldName = 'Field', max) => (value) => !value || parseFloat(value) <= max || `${fieldName} must be less than ${max}`;
const greaterThan = (fieldName = 'Field', min) => (value) => !value || parseFloat(value) >= min || `${fieldName} must be greater than ${min}`;
const notZero = (fieldName = 'Field') => (value) => !!value || value !== 0 || `${fieldName} must not be zero or empty`;
const requiredNumber = (fieldName = 'Field', min = 0, max = Infinity) => (value) => {
    if (!value && value !== 0) return `${fieldName} is required`;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return `${fieldName} must be a number`;
    if (numValue < min) return `${fieldName} must be at least ${min}`;
    if (numValue > max) return `${fieldName} must be at most ${max}`;

    return true;
};

export {requiredField, minLength, maxLength, emailFormat, isPositive, lessThan, greaterThan, notZero, requiredNumber};
