const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.json());
app.get('/', (req, res) => {
    res.json({ mensagem: 'API Saúde em Dia funcionando!' });
    });
    app.listen(PORT, () => {
        console.log(`Servidor Saúde em Dia iniciado na porta ${PORT}`);
        });