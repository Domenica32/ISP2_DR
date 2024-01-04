const express = require('express');
const mysql = require('mysql2');
const request = require('request');

const app = express();
const PORT = 3000;

// Configuración de la conexión a la base de datos
const conexionDB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'isprogreso2',
});

conexionDB.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos:', err);
    } else {
        console.log('Conexión exitosa a la base de datos');
    }
});

//PETICION GET 
app.get('/georreferenciacion', (req, res) => {
    const usuario = req.query.usuario;

    const consulta = `SELECT ciudad FROM clientes WHERE usuario = ?`;

    conexionDB.query(consulta, [usuario], (error, resultados) => {
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (resultados.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const ciudad = resultados[0].ciudad;

        const apiKey = '787550863725396978674x114132';
        const apiUrl = `https://geocode.xyz/${ciudad}?json=1&auth=${apiKey}`;

        request(apiUrl, (error, response, body) => {
            if (error) {
                console.error('Error en la solicitud a Geocode.xyz:', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }

            const datosGeorreferenciacion = JSON.parse(body);

            const { latt, longt } = datosGeorreferenciacion;

            const insercionGeorreferencia = `INSERT INTO info_georreferencias ( latt, longt) VALUES (?, ?)`;

            conexionDB.query(insercionGeorreferencia, [ latt, longt], (errorInsercion) => {
                if (errorInsercion) {
                    console.error('Error al insertar en la tabla georreferencias:', errorInsercion);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }

                res.json(datosGeorreferenciacion);  
            });
        });
    });
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${PORT}`);
});
