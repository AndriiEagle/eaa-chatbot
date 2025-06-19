const API_URL = 'http://localhost:3000/api/v1';

async function testAPI() {
    console.log('🧪 Тестирование API...');
    
    try {
        // Тест health endpoint
        console.log('1. Проверка health...');
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health:', healthData);
        
        // Тест ask endpoint
        console.log('2. Проверка ask...');
        const askResponse = await fetch(`${API_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: "Что такое EAA?",
                user_id: "test-user",
                session_id: "test-session"
            })
        });
        
        console.log('Response status:', askResponse.status);
        console.log('Response headers:', [...askResponse.headers.entries()]);
        
        if (!askResponse.ok) {
            const errorText = await askResponse.text();
            console.error('❌ Ask endpoint error:', errorText);
            return;
        }
        
        const askData = await askResponse.json();
        console.log('✅ Ask response:', askData);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAPI(); 