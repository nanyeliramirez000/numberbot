const Number = require('../models/number');

async function getStats() {
    try {
        console.log("Obteniendo Estadisticas");
    } catch (error) {
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

async function getCount() {
    try {
        // const total = await Number.count().exec();
        const total = await Number.find({active: true}).count().exec();
        const wProvider = await Number.find({active: true, ifprovider: true}).count().exec();

        const sProvider = total - wProvider;

        const count = `CON PROVEEDOR : ${convert(wProvider)} \n\nSIN PROVEEDOR   : ${convert(sProvider)} \n\nTOTAL NUMEROS : ${convert(total)}`;
        return {isOk: true, count};
    } catch (error) {
        return {isOk: false, message: "Hubo un error obteniendo conteo"};
    }
}

function convert(count){
    let value = count.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return value.substr(0, value.length - 3); 
}

async function getProviders(){
    try {
        const obj = {active: true};
        const ranking = await Number.aggregate([
            {$match:{$or: [ obj ]}},
            { $group: { _id: {provider: '$provider', active: '$active'}, count:{$sum: 1}}}
        ])

        if(!ranking){
            return {isOk: false, message: "Hubo un error obteniendo proveedores"};
        }

        return {isOk: true, result: ranking}
    } catch (error) {
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

async function getNumbers(message) {
    try {
        const command = message.split(':');
        const provider = command[1].toUpperCase();
        const quanty   = parseInt(command[2]);

        let result = undefined;

        if(quanty > 0){
            result = await Number.find({active: true, provider, diacriticSensitive: false}).limit(quanty);
        }else{
            result = await Number.find({active: true, provider, diacriticSensitive: false});
        }

        if(!result || result.length < 1){
            return {isOk: false, message: `No se encontraron numeros de ${provider}`};
        }

        return {isOk: true, provider, result};
    } catch (error) {
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

async function getAndUpdateNumbers(message) {
    try {
        const command = message.split(':');
        const provider = command[1].toUpperCase();
        const quanty   = parseInt(command[2]);

        const ids = new Array();
        let finder = undefined;

        if(quanty > 0){
            finder = await Number.find({provider, active: true}).limit(quanty)
        }else{
            finder = await Number.find({provider, active: true});
        }

        if(!finder || finder.length < 1){
            return {isOk: false, message: `No se encontraros numeros de ${provider}`};
        }

        finder.forEach(obj => ids.push(obj._id));

        const result = await Number.updateMany({_id: {$in: ids}}, {"$set":{"active": false}});
        if(!result || result.modifiedCount < 1){
            return {isOk: false, message: 'Error modificando numeros'}
        }

        return {isOk: true, result: finder, provider: provider};
    } catch (error) {
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

async function clearEditting(){
    try {
        const result = await Number.updateMany({active: true, editing: true}, {"$set":{"editing": false}});
        if(!result || result.modifiedCount < 1){
            return {isOk: false, message: `No se encontraros numeros`};
        }

        return {isOk: true, quanty: result.modifiedCount};
    } catch (error) {
        return {isOk: false}
    }
}

async function deleteNumbers(message) {
    try {
        const command = message.split(':');
        const provider = command[1].toUpperCase();
        const quanty   = parseInt(command[2]);

        // let result = undefined;

        // if(quanty > 0){
        //     result = await Number.deleteMany({provider: provider});
        // }else{
        //     result = await Number.deleteMany({provider: provider});
        // }

        // if(!result || !result.deletedCount){
        //     return {isOk: false, message: `No se encontraron numeros de ${provider}`};
        // }
        // return {isOk: true, quanty: result.deletedCount, privider: provider};

        const result = await Number.updateMany({active: true, provider: provider}, {"$set":{"active": false}});
        if(!result || result.modifiedCount < 1){
            return {isOk: false, message: `No se encontraron numeros de ${provider}`};
        }

        return {isOk: true, quanty: result.modifiedCount, privider: provider};

    } catch (error) {
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

async function deleteAll(){
    try {
        // const result = await Number.deleteMany({ifprovider: true});
        // if(!result || !result.deletedCount){
        //     return {isOk: false, message: `Hubo un error al intentar borrar todos los números`};
        // }
        // return {isOk: true, quanty: result.deletedCount};

        const result = await Number.updateMany({active: true, ifprovider: true}, {"$set":{"active": false}});
        if(!result || result.modifiedCount < 1){
            return {isOk: false, message: 'Hubo un error al intentar borrar todos los números'};
        }

        return {isOk: true, quanty: result.modifiedCount};
    } catch (error) {
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

async function restoreDB(){
    try {
        const result = await Number.updateMany({}, {"$set":{"active": true}});
        if(!result || result.modifiedCount < 1){
            return {isOk: false, message: 'Error restableciendo numeros'};
        }

        return {isOk: true, quanty: result.modifiedCount};
    } catch (error) {
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

module.exports = {
    getStats,
    getCount,
    getProviders, 
    getNumbers, 
    getAndUpdateNumbers, 
    clearEditting,
    deleteNumbers,
    deleteAll,
    restoreDB
};