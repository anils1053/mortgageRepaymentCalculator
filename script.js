let mortgageChart = null;

function calculateMortgage(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    
    const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const totalCost = monthlyPayment * numberOfPayments;
    const totalInterest = totalCost - principal;
    
    return {
        monthlyPayment,
        totalCost,
        totalInterest
    };
}

function updateChart(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    
    let balance = principal;
    let totalInterest = 0;
    const principalData = new Array(31).fill(0);
    const interestData = new Array(31).fill(0);
    const labels = [];
    
    const monthlyPayment = calculateMortgage(principal, annualRate, years).monthlyPayment;
    
    const currentYear = new Date().getFullYear();
    for (let year = 0; year <= 30; year++) {
        labels.push(currentYear + year);
        
        if (year <= years) {
            principalData[year] = balance;
            interestData[year] = totalInterest;
            
            if (year < years) {
                for (let month = 0; month < 12; month++) {
                    const interestPayment = balance * monthlyRate;
                    const principalPayment = monthlyPayment - interestPayment;
                    
                    balance -= principalPayment;
                    totalInterest += interestPayment;
                }
            }
        }
    }
    
    if (mortgageChart) {
        mortgageChart.destroy();
    }
    
    const ctx = document.getElementById('mortgageChart').getContext('2d');
    mortgageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Remaining Principal',
                data: principalData,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true
            }, {
                label: 'Cumulative Interest',
                data: interestData,
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Mortgage Amortization Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value.toLocaleString()
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    if (Number.isInteger(amount)) {
        return '$' + amount.toLocaleString();
    }
    return '$' + amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateCalculator() {
    // Parse values removing commas
    const loanAmount = parseFloat(document.getElementById('loanAmountText').value.replace(/,/g, ''));
    const interestRate = parseFloat(document.getElementById('interestRateText').value);
    const loanTerm = parseFloat(document.getElementById('loanTermText').value);
    const oneOffPayment = parseFloat(document.getElementById('oneOffPaymentText').value.replace(/,/g, '')) || 0;
    
    const adjustedLoanAmount = Math.max(0, loanAmount - oneOffPayment);
    const result = calculateMortgage(adjustedLoanAmount, interestRate, loanTerm);
    
    // Calculate different payment frequencies
    const monthlyPayment = result.monthlyPayment;
    const fortnightlyPayment = (monthlyPayment * 12) / 26;
    const weeklyPayment = (monthlyPayment * 12) / 52;
    
    // Calculate yearly totals for comparison
    const yearlyMonthly = monthlyPayment * 12;
    const yearlyFortnightly = fortnightlyPayment * 26;
    const yearlyWeekly = weeklyPayment * 52;
    
    // Calculate potential savings
    const fortSavings = yearlyFortnightly - yearlyMonthly;
    const weekSavings = yearlyWeekly - yearlyMonthly;
    
    document.getElementById('monthlyPayment').textContent = formatCurrency(monthlyPayment);
    document.getElementById('fortnightlyPayment').textContent = formatCurrency(fortnightlyPayment);
    document.getElementById('weeklyPayment').textContent = formatCurrency(weeklyPayment);
    document.getElementById('totalInterest').textContent = formatCurrency(result.totalInterest);
    document.getElementById('totalCost').textContent = formatCurrency(result.totalCost);
    
    
    updateChart(adjustedLoanAmount, interestRate, loanTerm);
}

// Update input values
function updateInputValues(inputId, value) {
    const textInput = document.getElementById(inputId + 'Text');
    
    if (inputId === 'loanAmount') {
        textInput.value = value;
    } else if (inputId === 'interestRate') {
        textInput.value = parseFloat(value).toFixed(2);
    } else if (inputId === 'loanTerm') {
        textInput.value = value;
        const years = Math.floor(value);
        const months = Math.round((value - years) * 12);
        document.getElementById('loanTermDisplay').textContent = 
            `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }
}


// Event listeners for text inputs and sliders
document.getElementById('loanAmountText').addEventListener('input', (e) => {
    // Store cursor position
    const cursorPos = e.target.selectionStart;
    const prevLength = e.target.value.length;
    
    // Remove any non-numeric characters except commas
    let value = e.target.value.replace(/[^0-9,]/g, '');
    // Remove all commas to get the actual number
    let numericValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numericValue)) numericValue = 0;
    
    // Format with commas
    const formattedValue = numericValue.toLocaleString();
    e.target.value = formattedValue;
    
    // Adjust cursor position after formatting
    const lengthDiff = formattedValue.length - prevLength;
    e.target.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
    
    document.getElementById('loanAmount').value = numericValue;
    updateCalculator();
});

document.getElementById('loanAmount').addEventListener('input', (e) => {
    document.getElementById('loanAmountText').value = parseFloat(e.target.value).toLocaleString();
    updateCalculator();
});

document.getElementById('interestRateText').addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    value = parseFloat(value);
    if (isNaN(value)) value = 0;
    document.getElementById('interestRate').value = value;
    updateCalculator();
});

document.getElementById('interestRate').addEventListener('input', (e) => {
    document.getElementById('interestRateText').value = parseFloat(e.target.value).toFixed(2);
    updateCalculator();
});

document.getElementById('loanTermText').addEventListener('input', (e) => {
    let value = parseFloat(e.target.value);
    if (value < 1) value = 1;
    if (value > 30) value = 30;
    document.getElementById('loanTerm').value = value;
    updateCalculator();
});

document.getElementById('loanTerm').addEventListener('input', (e) => {
    let value = parseFloat(e.target.value);
    document.getElementById('loanTermText').value = value;
    const years = Math.floor(value);
    const months = Math.round((value - years) * 12);
    document.getElementById('loanTermDisplay').textContent = 
        `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    updateCalculator();
});

// Event listeners for one-off payment
document.getElementById('oneOffPaymentText').addEventListener('input', (e) => {
    // Store cursor position
    const cursorPos = e.target.selectionStart;
    const prevLength = e.target.value.length;
    
    // Remove any non-numeric characters except commas
    let value = e.target.value.replace(/[^0-9,]/g, '');
    // Remove all commas to get the actual number
    let numericValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numericValue)) numericValue = 0;
    
    // Format with commas
    const formattedValue = numericValue.toLocaleString();
    e.target.value = formattedValue;
    
    // Adjust cursor position after formatting
    const lengthDiff = formattedValue.length - prevLength;
    e.target.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
    
    document.getElementById('oneOffPayment').value = numericValue;
    updateCalculator();
});

document.getElementById('oneOffPayment').addEventListener('input', (e) => {
    document.getElementById('oneOffPaymentText').value = parseFloat(e.target.value).toLocaleString();
    updateCalculator();
});

// Mode switching
document.getElementById('singleMode').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('compareMode').classList.remove('active');
    document.getElementById('singleCalculator').classList.remove('hidden');
    document.getElementById('compareCalculator').classList.add('hidden');
    document.getElementById('singleChart').classList.remove('hidden');
    document.querySelector('.faq-section').classList.remove('hidden');
});

document.getElementById('compareMode').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('singleMode').classList.remove('active');
    document.getElementById('ratesMode').classList.remove('active');
    document.getElementById('singleCalculator').classList.add('hidden');
    document.getElementById('compareCalculator').classList.remove('hidden');
    document.getElementById('currentRates').classList.add('hidden');
    document.getElementById('singleChart').classList.add('hidden');
    document.querySelector('.faq-section').classList.add('hidden');
    updateComparisonCalculator();
});

document.getElementById('ratesMode').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('singleMode').classList.remove('active');
    document.getElementById('compareMode').classList.remove('active');
    document.getElementById('singleCalculator').classList.add('hidden');
    document.getElementById('compareCalculator').classList.add('hidden');
    document.getElementById('currentRates').classList.remove('hidden');
    document.getElementById('singleChart').classList.add('hidden');
    document.querySelector('.faq-section').classList.add('hidden');
    updateRates();
});

async function fetchRates() {
    try {
        // Simulated API response with current rates
        const bankData = {
            'ANZ': {
                logo: 'https://images.ctfassets.net/sj451a25oez5/58sMWwHziZgsPPA0XgeSth/88a21917c8b3ab173d727a8c60feb670/ANZ-logo.svg',
                rates: {
                    sixMonths: '5.89%',
                    oneYear: '5.29%',
                    twoYear: '4.99%',
                    threeYear: '5.29%',
                    floating: '6.90%'
                },
                special: true
            },
            'ASB': {
                logo: 'https://images.ctfassets.net/sj451a25oez5/3TPqc8X0IbjgfzkcVbd45N/9e698d1141f0f5dd1c053954660b2694/asb-logo.svg',
                rates: {
                    sixMonths: '5.89%',
                    oneYear: '5.49%',
                    twoYear: '5.29%',
                    threeYear: '5.59%',
                    floating: '6.89%'
                },
                special: false
            },
            'BNZ': {
                logo: 'https://images.ctfassets.net/sj451a25oez5/47QqMMAMOlk2WgIVqrQPdP/e6d4a53e359ff79b925d27181928fda4/BNZ-logo.svg',
                rates: {
                    sixMonths: '5.89%',
                    oneYear: '5.55%',
                    twoYear: '5.29%',
                    threeYear: '5.59%',
                    floating: '6.94%'
                },
                special: false
            },
            'Kiwibank': {
                logo: 'https://images.ctfassets.net/sj451a25oez5/1QbJxqTkTkeFEoFo4VYKj1/37f4388414dae30236720469b5e08fa5/Kiwibank_logo.svg',
                rates: {
                    sixMonths: '5.79%',
                    oneYear: '5.19%',
                    twoYear: '5.19%',
                    threeYear: '5.59%',
                    floating: '6.75%'
                },
                special: true
            },
            'Westpac': {
                logo: 'https://images.ctfassets.net/sj451a25oez5/3PnIG9VOKEvvaT0jxYZhNJ/5d6e8f492c7b75a4c94dae5188629cd7/westpac-logo.svg',
                rates: {
                    sixMonths: '5.99%',
                    oneYear: '5.49%',
                    twoYear: '5.29%',
                    threeYear: '5.39%',
                    floating: '6.99%'
                },
                special: true
            }
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return bankData;
    } catch (error) {
        console.error('Error fetching rates:', error);
        return null;
    }
}

async function updateRates() {
    const ratesContent = document.getElementById('ratesContent');
    ratesContent.innerHTML = '<div class="loading">Fetching latest rates...</div>';

    const bankData = await fetchRates();
    if (!bankData) {
        ratesContent.innerHTML = '<div class="error">Unable to fetch current rates. Please try again later.</div>';
        return;
    }

    ratesContent.innerHTML = '';
    const mainBanks = ['ANZ', 'ASB', 'BNZ', 'Kiwibank', 'Westpac'];

    mainBanks.forEach(bank => {
        const data = bankData[bank];
        const row = document.createElement('div');
        row.className = 'rates-row bank-row';
        
        row.innerHTML = `
            <div class="bank-col">
                <img src="${data.logo}" alt="${bank} logo">
                <span>${bank}${data.special ? ' Special*' : ''}</span>
            </div>
            <div class="rate-col ${data.special ? 'special-rate' : ''}">${data.rates.sixMonths}</div>
            <div class="rate-col ${data.special ? 'special-rate' : ''}">${data.rates.oneYear}</div>
            <div class="rate-col ${data.special ? 'special-rate' : ''}">${data.rates.twoYear}</div>
            <div class="rate-col ${data.special ? 'special-rate' : ''}">${data.rates.threeYear}</div>
            <div class="rate-col ${data.special ? 'special-rate' : ''}">${data.rates.floating}</div>
        `;
        
        ratesContent.appendChild(row);
    });

    const now = new Date();
    document.getElementById('lastUpdated').textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
}

// Comparison mode calculations
function updateComparisonCalculator() {
    const scenario1 = {
        loanAmount: parseFloat(document.getElementById('loanAmount1Text').value.replace(/,/g, '')),
        interestRate: parseFloat(document.getElementById('interestRate1Text').value),
        loanTerm: parseFloat(document.getElementById('loanTerm1Text').value)
    };

    const scenario2 = {
        loanAmount: parseFloat(document.getElementById('loanAmount2Text').value.replace(/,/g, '')),
        interestRate: parseFloat(document.getElementById('interestRate2Text').value),
        loanTerm: parseFloat(document.getElementById('loanTerm2Text').value)
    };

    const result1 = calculateMortgage(scenario1.loanAmount, scenario1.interestRate, scenario1.loanTerm);
    const result2 = calculateMortgage(scenario2.loanAmount, scenario2.interestRate, scenario2.loanTerm);

    // Calculate different payment frequencies for both scenarios
    const monthly1 = result1.monthlyPayment;
    const fortnightly1 = (monthly1 * 12) / 26;
    const weekly1 = (monthly1 * 12) / 52;

    const monthly2 = result2.monthlyPayment;
    const fortnightly2 = (monthly2 * 12) / 26;
    const weekly2 = (monthly2 * 12) / 52;

    // Update payment displays with highlighting
    const updateComparison = (id1, id2, diffId, value1, value2) => {
        const elem1 = document.getElementById(id1);
        const elem2 = document.getElementById(id2);
        const diffElem = document.getElementById(diffId);
        
        elem1.textContent = formatCurrency(value1);
        elem2.textContent = formatCurrency(value2);
        
        elem1.className = value1 > value2 ? 'higher' : 'lower';
        elem2.className = value2 > value1 ? 'higher' : 'lower';
        
        const difference = Math.abs(value2 - value1);
        diffElem.textContent = formatCurrency(difference);
    };

    // Apply to all comparison rows
    updateComparison('monthlyPayment1', 'monthlyPayment2', 'monthlyDiff', monthly1, monthly2);
    updateComparison('fortnightlyPayment1', 'fortnightlyPayment2', 'fortnightlyDiff', fortnightly1, fortnightly2);
    updateComparison('weeklyPayment1', 'weeklyPayment2', 'weeklyDiff', weekly1, weekly2);
    updateComparison('totalInterest1', 'totalInterest2', 'interestDiff', result1.totalInterest, result2.totalInterest);
    updateComparison('totalCost1', 'totalCost2', 'costDiff', result1.totalCost, result2.totalCost);
}

// Event listeners for comparison mode
['loanAmount', 'interestRate', 'loanTerm'].forEach(field => {
    [1, 2].forEach(scenario => {
        document.getElementById(`${field}${scenario}Text`).addEventListener('input', (e) => {
            if (field === 'loanAmount') {
                // Store cursor position
                const cursorPos = e.target.selectionStart;
                const prevLength = e.target.value.length;
                
                // Remove any non-numeric characters except commas
                let value = e.target.value.replace(/[^0-9,]/g, '');
                // Remove all commas to get the actual number
                let numericValue = parseFloat(value.replace(/,/g, ''));
                if (isNaN(numericValue)) numericValue = 0;
                
                // Format with commas
                const formattedValue = numericValue.toLocaleString();
                e.target.value = formattedValue;
                
                // Adjust cursor position after formatting
                const lengthDiff = formattedValue.length - prevLength;
                e.target.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
                
                document.getElementById(`${field}${scenario}`).value = numericValue;
            } else {
                let value = e.target.value.replace(/[^0-9.]/g, '');
                value = parseFloat(value);
                if (isNaN(value)) value = 0;
                document.getElementById(`${field}${scenario}`).value = value;
                if (field === 'loanTerm') {
                    const years = Math.floor(value);
                    const months = Math.round((value - years) * 12);
                    document.getElementById(`loanTermDisplay${scenario}`).textContent = 
                        `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''}`;
                }
            }
            updateComparisonCalculator();
        });

        document.getElementById(`${field}${scenario}`).addEventListener('input', (e) => {
            let value = e.target.value;
            if (field === 'loanAmount') {
                value = parseFloat(value).toLocaleString();
            } else if (field === 'interestRate') {
                value = parseFloat(value).toFixed(2);
            }
            document.getElementById(`${field}${scenario}Text`).value = value;
            if (field === 'loanTerm') {
                const years = Math.floor(value);
                const months = Math.round((value - years) * 12);
                document.getElementById(`loanTermDisplay${scenario}`).textContent = 
                    `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''}`;
            }
            updateComparisonCalculator();
        });
    });
});

// Toggle payment options
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const targetId = this.dataset.target;
        const targetElement = document.getElementById(targetId);
        const isHidden = targetElement.classList.toggle('hidden');
        this.textContent = isHidden ? 'Show' : 'Hide';
    });
});

// Initial calculation
updateCalculator();
