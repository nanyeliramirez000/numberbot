const express = require('express');
const router = express.Router();
const path   = require('path');
const fs     = require('fs');
const Number = require('../models/number');

router.get('/', function (req, res) {
    res.status(200).json({
        ok: true,
        server: 'ONLINE'
    })
})

router.get('/add', function (req, res) {
    res.render("index");
})

router.get('/all', async function (req, res) {
    try {
        const results = await Number.find({});
        if(!results){
            return res.status(200).json({ok: false, message: "Error obteniendo los numeros"})
        }

        let numbers = "";
        for (let index = 0; index < results.length; index++) {
            const current = results[index];
            numbers += `${current.number}:${current.provider}\n`;
        }

        console.log(numbers.length, "NUMEROS")

        console.log("Salio");
        saveList(numbers);

        return res.status(200).json({ok:true, result: results.length});
    } catch (error) {
        return res.status(200).json({ok: false, message: "Hubo un error inesperado obteniendo los numeros"});
    }
})

function saveList(list){
    fs.writeFile(`ready_numbers.txt`, list, (err) => {
        if(err){ console.log("hubo error"); return false;}
        console.log("*** Lista guardada con exito! ***");
        // process.exit(0);
    });
}
  
router.get('/out/get', async (req, res) => {
    try {
        // const results = await Number.aggregate([
        //     {
        //         $match: {
        //             ifprovider: false,
        //             editing: false
        //         }
        //     },
        //     { $sample: { size: 1 } }
        // ]);

        // if (results.length) {
        //     await Number.updateOne(
        //       { _id: results[0]._id }, 
        //       {editing: true}
        //     ); 

        //     console.log(`Numero Obtenido (${results[0].number})`);
        //     return res.status(200).json({ok:true, result: results[0]});
        // }else{
        //     console.log("No se encontro ningun numero '/out/get'");
        //     return res.status(200).json({ok:false, result: "No se encontro ningun numero"});
        // }

        // , {new: true}
        const results = await Number.findOneAndUpdate({ifprovider: false, editing: false}, {editing: true});
        if(!results){
            return res.status(200).json({ok: false, message: "Error obteniendo y actualizando numero."})
        } 

        console.log(`Numero Obtenido (${results.number})`);
        return res.status(200).json({ok:true, result: results});

    } catch (error) {
        console.log("Error '/out/get' => ", error);
        return res.status(200).json({ok: false, message: "Hubo un error inesperado obteniendo y actualizando el numero"});
    }
})

router.get('/out/clear', async (req, res) => {
    try {
        const result = await Number.updateMany({editing: true}, {"$set":{"editing": false}});
        if(!result || result.modifiedCount < 1){
            return res.status(200).json({isOk: false, message: `Error restaurando numeros`});
        }

        console.log(`Numeros Restaurados (${result.modifiedCount})`);
        return res.status(200).json({isOk: true, quanty: result.modifiedCount});
    } catch (error) {
        console.log("Error '/out/clear' => ", error);
        return res.status(200).json({isOk: false, message: "Error inesperado en catch"});
    }
})

router.put('/out/upd', async (req, res) => {
    try {
        const number   = req.body.number;
        const numberId = req.body.numberId;
        const provider = req.body.provider;

        const result = await Number.updateOne(
            { _id: numberId }, 
            {provider: provider, ifprovider: true, editing: false}
        );

        if(!result || result.modifiedCount < 1){
            console.log("Error '/out/upd' => ", result);
            return res.status(200).json({ok: false, message: "Error actualizando numero '/out/upd'."})
        }

        console.log(`Numero Actualizado (${number})`);
        return res.status(200).json({ok:true, version: 'editing', number: number});
    } catch (error) {
        console.log("Error catch '/out/upd' => ", error);
        return res.status(200).json({ok: false, message: "Hubo un error inesperado actualizando el numero '/out/upd'"});
    }
})

router.put('/editing', async function (req, res) {
    try {
        const ids = new Array();
        let finder = await Number.find({});
        if(!finder || finder.length < 1){
            return res.status(200).json({isOk: false, message: "No se encontraron numeros"});
        }
        finder.forEach(obj => ids.push(obj._id));
    
        const result = await Number.updateMany({_id: {$in: ids}}, {"$set":{"editing": false}});
        if(!result || result.modifiedCount < 1){
            return res.status(200).json({isOk: false, message: "Error modificando numeros"});
        }
    
        console.log(`Editando Numero (${result.number})`);
        return res.status(200).json({isOk: true, result, numbers: finder.length});
    } catch (error) {
        console.log("Error '/editing' => ", error);
        return res.status(200).json({isOk: false, message: "Error modificando numeros"});
    }
})

router.post('/out/add', async (req, res) => {
    const {number, provider} = req.body;

    if(!number || !provider) {
        return res.status(200).json({ok: false, message: "Informacion requerida"})
    }

    try {
        const result = await Number.findOne({number});
        if(result){
            return res.status(200).json({ok: false, message: "El numero ya existe"})
        }
        newNumber = new Number({
            number,
            provider: (provider === 'NO' || provider.length < 4) ? 'NO VERIFICADO' : provider,
            ifprovider: (provider.length > 3) ? true : false
        });
        await newNumber.save();
        console.log(`Numero Agregado (${result.number})`);
        return res.status(200).json({ok:true, message: "Numero Agregado!"});
    } catch (error) {
        console.log("Error '/out/add' => ", error);
        return res.status(200).json({ok: false, message: "Hubo un error inesperado agregando el numero"});
    }
});

router.post('/out/add-bulk', async (req, res) => {
    try {
        const bulk = req.body.bulk;
        if(!bulk) {
            return res.status(200).json({ok: false, message: "Informacion requerida"});
        }
    
        let lists = bulk.split('\n');
        const numbers = new Array();
        const depureNumbers = new Array();
        let repeadCounter = 0;
    
        // ddd = '829749180,no; 8496539180,claro; 8297802234,no';
    
        if(!lists || !lists.length){
            return res.status(200).json({ok: false, message: "Empty list"});
        }
    
        for (let index = 0; index < lists.length; index++) {
            let list = lists[index];
    
            if(!list || !list.length) continue;
    
            let data = list.split(',');
    
            if(!data[0] || !data[0].length || !data[1] || !data[1].length) {
                continue;
            }
    
            let number   = data[0].trim();
            let provider = data[1].trim();
    
            numbers.push({
                number,
                provider: (provider === 'NO' || provider.length < 4) ? 'NO VERIFICADO' : provider,
                fprovider: (provider.length > 3) ? true : false
            });
        }
    
        if(!numbers || !numbers.length){
            return res.status(200).json({ok:false, message: 'Error ingresando numeros'});
        }
    
        for (let i = 0; i < numbers.length; i++) {
            const element = numbers[i];
            const exits = await Number.findOne({number: element.number});
            if(exits){
                repeadCounter++;
                continue;
            }
            depureNumbers.push(element);
        }
    
        if(!depureNumbers || !depureNumbers.length){
            return res.status(200).json({ok:false, message: `Error numeros Repetidos(${repeadCounter})`});
        }
    
        Number.insertMany(depureNumbers)
            .then(function(docs) {
                let pls1 = docs.length > 1 ? 's' : '';
                let pls2 = repeadCounter > 1 ? 's' : '';

                console.log(`Numeros Agregados (${docs.length})`);
    
                return res.status(200).json({
                    ok: true, 
                    message: `${docs.length} numero${pls1} ingresado${pls1}!`, 
                    repead : `${repeadCounter} numero${pls2} repetido${pls2}`
                });
            })
            .catch(function(err) {
                console.log("Error '/out/add-bulk' => ", err);
                return res.status(200).json({ok:false, message: 'Error ingresando numeros'});
            });
    } catch (error) {
        console.log("Error catch '/out/add-bulk' => ", error);
        return res.status(200).json({ok:false, message: 'Error ingresando numeros'});
    }
});

router.post('/out/add-numbers', async (req, res) => {
    try {
        if(!req.files || !req.files.file){
            return res.render("index", {isOk: false, message: 'Debe Seleccionar un archivo de texto'});
        }

        let ehloq = req.files.file;
        if(!ehloq || !ehloq.name){
            return res.render("index", {isOk: false, message: 'Archivo Invalido'});
        }

        const numbers = clearText(ehloq.data);
        if(!numbers || !numbers.isOk){
            return res.render("index", {isOk: false, message: numbers.message});
        }

        if(!numbers.result.length){
            return res.render("index", {isOk: false, message: 'No se encontraron numeros validos para ingresar.'});
        }

        Number.insertMany(numbers.result)
            .then(function(docs) {
                let pls1 = docs.length > 1 ? 's' : '';

                console.log(`Numeros Agregados (${docs.length})`);
                return res.render("index", {isOk: true, message: `${docs.length} numero${pls1} ingresado${pls1}!`});
            })
            .catch(function(err) {
                console.log("Error '/out/add-numbers' => ", err);
                return res.render("index", {isOk: false, message: 'Error ingresando numeros'});
            });
    } catch (error) {
        console.log("Error catch '/out/add-bulk' => ", error);
        return res.render("index", {isOk: false, message: 'Error ingresando numeros'});
    }
});

router.put('/out/del', async (req, res) => {
    try {
        const number   = req.body.number;
        const numberId = req.body.numberId;

        const result = await Number.deleteOne({_id: numberId});
        if(!result || result.deletedCount < 1){
            console.log("Error '/out/del' => ", result);
            return res.status(200).json({ok: false, message: "Error eliminando numero."})
        }

        console.log(`Numeros Eliminado (${number})`);
        return res.status(200).json({ok:true, version: 'eliminado', number: number});
    } catch (error) {
        console.log("Error catch '/out/del' => ", result);
        return res.status(200).json({ok: false, message: "Hubo un error inesperado eliminando el numero"});
    }
})

router.put('/out/del/inactive', async (req, res) => {
    try {

        // let finder = await Number.find({});
        // if(!finder || finder.length < 1){
        //     return res.status(200).json({isOk: false, message: "No se encontraron numeros"});
        // }
        // finder.forEach(obj => ids.push(obj._id));
    
        // const result = await Number.updateMany({_id: {$in: ids}}, {"$set":{"editing": false}});
        // if(!result || result.modifiedCount < 1){
        //     return res.status(200).json({isOk: false, message: "Error modificando numeros"});
        // }
    
        // console.log(`Editando Numero (${result.number})`);
        // return res.status(200).json({isOk: true, result, numbers: finder.length});

        let finder = await Number.find({active: false}).limit(500000);
        if(!finder || finder.length < 1){
            return res.status(200).json({isOk: false, message: "No se encontraron numeros"});
        }
        finder.forEach(obj => ids.push(obj._id));

        const result = await Number.deleteMany({_id: {$in: ids}});
        if(!result || result.modifiedCount < 1){
            return res.status(200).json({isOk: false, message: "Error modificando numeros"});
        }
        return res.status(200).json({isOk: true, numbers: finder.length});

        // const result = await Number.deleteMany({active: false});
        // if(!result || !result.deletedCount){
        //     return {isOk: false, message: `No se encontraron numeros para eliminar`};
        // }
        // console.log(`Numeros Eliminado (${result.deletedCount})`);
        // return {isOk: true, quanty: result.deletedCount};
    } catch (error) {
        console.log("Error catch '/out/del' => ", result);
        return res.status(200).json({ok: false, message: "Hubo un error inesperado eliminando el numero"});
    }
})

function clearText(data){
    try {
        const readyNumber = new Array();
        const numbers = data.toString()
                            .split('\n')
                            .filter(Boolean);

        for (let index = 0; index < numbers.length; index++) {
            let current = numbers[index].trim();
            current = current.replace(/ /g, "");
            const number = current.substr(-10,current.length);

            if(!number || !number.length){
                continue;
            }
    
            if(number.length !== 10) {
                continue;
            }
            // if(readyNumber.find(n => n.number === number)){
            //     continue;
            // }
            // if( !(number.match(/\d/g)) || !(number.match(/\d/g).length===10)){
            //     continue;
            // }    
            readyNumber.push({number: number});
        }
        return {isOk: true, result: readyNumber}
    } catch (error) {
        console.log("Error => ", error);
        return {isOk: false, message: "Hubo un error inesperado."}
    }
}

// router.post('/out/add-numbers', async (req, res) => {
//     try {
//         if(!req.body.txtarea) {
//             return res.render("index", {isOk: false, message: 'Informacion requerida'});
//         }
    
//         const txtarea = req.body.txtarea.trim();
//         let lists = txtarea.split('\n');
//         const numbers = new Array();
     
    
//         if(!lists || !lists.length){
//             return res.render("index", {isOk: false, message: 'Lista Vacia'});
//         }
    
//         for (let index = 0; index < lists.length; index++) {
//             let number = lists[index];
//             number = number.replace(/\r?\n|\r/g, "");
//             number = number.substr(-10,number.length);
//             if(!number || number.length !== 10) continue;
    
//             numbers.push({
//                 number,
//                 provider: 'NO VERIFICADO',
//                 fprovider: false
//             });
//         }
    
//         if(!numbers || !numbers.length){
//             return res.render("index", {isOk: false, message: 'No se encontraron numeros validos'});
//         }

//         return res.render("index", {isOk: true, message: `xxx!`});
    
//         // Number.insertMany(numbers)
//         //     .then(function(docs) {
//         //         let pls1 = docs.length > 1 ? 's' : '';
//         //         return res.render("index", {isOk: true, message: `${docs.length} numero${pls1} ingresado${pls1}!`});
//         //     })
//         //     .catch(function(err) {
//         //         return res.render("index", {isOk: false, message: 'Error ingresando numeros'});
//         //     });
//     } catch (error) {
//         console.log("ERROR => ", error);
//         return res.render("index", {isOk: false, message: 'Error ingresando numeros'});
//     }
// });

module.exports = router;