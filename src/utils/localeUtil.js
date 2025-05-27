const formatDate = (date) => {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);

        const date = new Date(year, month, day);

        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    return new Date(dateStr);
};
const displayCurrency = (value) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-US', {
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(value);
}

const displayDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });
}

const formatDateTime = (dateString, seconds = false) => {
    if (!dateString) return '-';

    const date = dateString instanceof Date ? dateString : new Date(dateString);

    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (seconds) {
        const secs = date.getSeconds().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${secs}`;
    }

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export {formatDate, parseDate, displayCurrency, displayDate, formatDateTime};
