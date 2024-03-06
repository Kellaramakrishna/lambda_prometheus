const client = require('prom-client');
const register = new client.Registry(); 
const meters = {};

const buildingMeters = {};

exports.createMeterReadings = async (event, context) => {
    try {
        // Parse event body if necessary
        const body = JSON.parse(event.body);
        const { meterName, reading } = body;

        const utcDate = new Date();
        const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const timestamp = istDate.toLocaleString();

        if (!meterName || reading === undefined || !timestamp) {
            return {
                statusCode: 400,
                body: 'Missing required fields: meterName, reading, timestamp'
            };
        }

        // Create or update the gauge for the specific meter
        if (!meters[meterName]) {
            meters[meterName] = new client.Gauge({
                name: `${meterName}`,
                help: `Energy meter reading for ${meterName} in kWh`,
                labelNames: ['timestamp'],
            });
        }

        meters[meterName].set({ timestamp: timestamp.toString() }, reading);
        console.log(meters);

        // Return a success response
        return {
            statusCode: 200,
            body: 'Reading recorded'
        };
    } catch (err) {
        console.log(err);
        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};


exports.createBuildingReadings = async (event, context) => {
    try {
        // Parse event body if necessary
        const body = JSON.parse(event.body);
        const { buildingName, meterName, reading } = body;

        const utcDate = new Date();
        const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const timestamp = istDate.toLocaleString();

        if (!buildingName || !meterName || reading === undefined || !timestamp) {
            return {
                statusCode: 400,
                body: 'Missing required fields: buildingName, meterName, reading, timestamp'
            };
        }

        // Create or update the gauge for the specific meter
        if (!buildingMeters[buildingName]) {
            buildingMeters[buildingName] = new client.Gauge({
                name: `${buildingName}`,
                help: `Energy meter reading for building ${buildingName} - ${meterName} in kWh`,
                labelNames: ['timestamp'],
            });
            register.registerMetric(buildingMeters[buildingName]);
        }

        buildingMeters[buildingName].set({ timestamp: timestamp.toString() }, reading);
        console.log(buildingMeters);
        
        // Return a success response
        return {
            statusCode: 200,
            body: 'Reading recorded'
        };
    } catch (err) {
        console.log(err);
        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};


exports.getMetrics = async (event, context) => {
    const response = {
        statusCode: 200,
        headers: { 'Content-Type': client.register.contentType },
        body: await client.register.metrics(),
    };
    return response;
};


