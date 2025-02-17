document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('auth-button');
    const statusText = document.getElementById('status-text');
    const loading = document.getElementById('loading');
    const emailList = document.getElementById('email-list');
    const emailsContainer = document.querySelector('.emails-container');
    const errorMessage = document.getElementById('error-message');
    const errorText = errorMessage.querySelector('.error');

    // Check for auth callback status
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    
    if (authStatus) {
        // Clear the URL parameters
        window.history.replaceState({}, document.title, '/');
        
        if (authStatus === 'success') {
            checkAuthStatus();
        } else {
            showError('Authentication failed. Please try again.');
        }
    } else {
        // Regular startup check
        checkAuthStatus();
    }

    authButton.addEventListener('click', async () => {
        if (authButton.textContent === 'Logout') {
            await logout();
        } else {
            await authenticate();
        }
    });

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (data.authenticated) {
                updateUIForAuthenticated();
                fetchEmails();
            } else {
                updateUIForUnauthenticated();
            }
        } catch (error) {
            showError('Error checking authentication status');
        }
    }

    async function authenticate() {
        try {
            window.location.href = '/api/auth/gmail';
        } catch (error) {
            showError('Error during authentication');
        }
    }

    async function logout() {
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                updateUIForUnauthenticated();
                emailList.classList.add('hidden');
                emailsContainer.innerHTML = '';
            } else {
                showError('Error logging out');
            }
        } catch (error) {
            showError('Error during logout');
        }
    }

    async function fetchEmails() {
        try {
            loading.classList.remove('hidden');
            emailList.classList.add('hidden');
            errorMessage.classList.add('hidden');

            const response = await fetch('/api/emails');
            const emails = await response.json();

            loading.classList.add('hidden');
            emailList.classList.remove('hidden');

            displayEmails(emails);
        } catch (error) {
            loading.classList.add('hidden');
            showError('Error fetching emails');
        }
    }

    async function analyzeEmail(messageId, emailContent) {
        try {
            const response = await fetch(`/api/emails/${messageId}/analyze`);
            const analysis = await response.json();
            return analysis;
        } catch (error) {
            console.error('Error analyzing email:', error);
            throw error;
        }
    }

    function displayAnalysis(analysisContainer, analysis) {
        analysisContainer.innerHTML = `
            <div class="ai-analysis">
                <h3>Email Summary</h3>
                <div class="ai-analysis-content">${escapeHtml(analysis.summary)}</div>
            </div>
            <div class="ai-analysis">
                <h3>Key Information</h3>
                <div class="ai-analysis-content">${formatKeyInfo(analysis.keyInfo)}</div>
            </div>
        `;
    }

    function formatKeyInfo(keyInfo) {
        const sections = {
            dates: 'Important Dates',
            actions: 'Action Items',
            decisions: 'Key Decisions',
            contacts: 'Important Contacts',
            numbers: 'Critical Numbers'
        };
        
        return Object.entries(sections)
            .map(([key, title]) => {
                const items = keyInfo[key] || [];
                if (items.length === 0) return '';
                return `${title}:\n${items.map(item => `• ${item}`).join('\n')}`;
            })
            .filter(section => section.length > 0)
            .join('\n\n');
    }

    function displayEmails(emails) {
        emailsContainer.innerHTML = '';

        emails.forEach(async (email) => {
            try {
                const response = await fetch(`/api/emails/${email.id}`);
                const emailContent = await response.json();
                
                const emailCard = createEmailCard(emailContent);
                emailsContainer.appendChild(emailCard);
            } catch (error) {
                console.error('Error fetching email content:', error);
            }
        });
    }

    function createEmailCard(email) {
        const card = document.createElement('div');
        card.className = 'email-card';

        const headers = email.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown sender';
        const date = new Date(headers.find(h => h.name === 'Date')?.value || '').toLocaleString();

        let body = extractEmailBody(email.payload);

        const analysisContainer = document.createElement('div');
        analysisContainer.className = 'analysis-container hidden';

        card.innerHTML = `
            <div class="email-header">
                <div class="email-subject">${escapeHtml(subject)}</div>
                <div class="email-from">${escapeHtml(from)}</div>
                <div class="email-date">${escapeHtml(date)}</div>
            </div>
            <div class="email-preview">${escapeHtml(body)}</div>
            <button class="analyze-button">Analyze Email</button>
        `;

        card.appendChild(analysisContainer);

        const analyzeButton = card.querySelector('.analyze-button');
        analyzeButton.addEventListener('click', async () => {
            try {
                analyzeButton.disabled = true;
                analyzeButton.textContent = 'Analyzing...';
                
                const analysis = await analyzeEmail(email.id, body);
                displayAnalysis(analysisContainer, analysis);
                
                analysisContainer.classList.remove('hidden');
                analyzeButton.textContent = 'Update Analysis';
                analyzeButton.disabled = false;
            } catch (error) {
                analyzeButton.textContent = 'Analysis Failed';
                setTimeout(() => {
                    analyzeButton.textContent = 'Retry Analysis';
                    analyzeButton.disabled = false;
                }, 3000);
            }
        });

        return card;
    }

    function extractEmailBody(payload) {
        if (payload.parts) {
            const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
            if (textPart && textPart.body.data) {
                return decodeBase64(textPart.body.data);
            }
            const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
            if (htmlPart && htmlPart.body.data) {
                return stripHtml(decodeBase64(htmlPart.body.data));
            }
        } else if (payload.body.data) {
            return payload.mimeType === 'text/html'
                ? stripHtml(decodeBase64(payload.body.data))
                : decodeBase64(payload.body.data);
        }
        return 'No content';
    }

    function decodeBase64(data) {
        return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    function stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function updateUIForAuthenticated() {
        statusText.textContent = 'Authenticated';
        authButton.textContent = 'Logout';
    }

    function updateUIForUnauthenticated() {
        statusText.textContent = 'Not authenticated';
        authButton.textContent = 'Login with Gmail';
    }

    function showError(message) {
        errorMessage.classList.remove('hidden');
        errorText.textContent = message;
    }
}); 