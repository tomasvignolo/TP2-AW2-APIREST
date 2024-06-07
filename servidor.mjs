import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs';
import { join, parse } from 'node:path';
import { error } from 'node:console';

const port = 3000; // configuración
const version1 = join('API', 'version1'); // versiones para trabajar con los archivos

const eliminarProducto = (request, response, version1) => {
    const ruta = join(version1, 'productos.json');
    const ID = parse(request.url).base; // Obtener id de la URL(ruta)
    
    readFile(ruta, (error, datos) => { // Leer el JSON
        if (error) {
            response.writeHead(500, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            });
            response.end('Error al leer el archivo de productos');
        } else {
            const objetoJSON = JSON.parse(datos); // Convertirlo a objeto JS
            const arrayProductos = objetoJSON.productos; // Obtener el arreglo en la propiedad productos (Ver el JSON)
            const arrayProductosNuevo = arrayProductos.filter((producto) => { // Crear un nuevo array usando filter (sin el producto que queremos eliminar)
                return parseInt(producto.id) !== parseInt(ID);
            });
            objetoJSON.productos = arrayProductosNuevo; // Pisamos el objeto JS con el nuevo array
            const datosObjetoJSON = JSON.stringify(objetoJSON); // Escribir el JSON nuevo
            writeFile(ruta, datosObjetoJSON, (error) => {
                if (error) {
                    response.writeHead(400, {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*'
                    });
                    response.end('Ha ocurrido un error al eliminar el producto');
                } else {
                    response.writeHead(202, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    response.end('Recurso correctamente eliminado');
                }
            });
        }
    });
};

const server = createServer((request, response) => {
    if (request.method === 'OPTIONS') { // Preflight
        response.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        response.end();
    } else if (request.method === 'GET') { // Obtener producto
        if (request.url === '/version1/productos') {
            const ruta = join(version1, 'productos.json'); // ruta de archivos, no de petición
            readFile(ruta, (error, datos) => {
                if (error) {
                    response.writeHead(500, {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*'
                    });
                    response.end('Error al leer el archivo de productos.');
                } else {
                    response.writeHead(200, {
                        'Content-Type': 'application/json;charset=utf-8',
                        'Access-Control-Allow-Origin': '*'
                    });
                    response.end(datos);
                }
            });
        } else if (request.url.match('/version1/productos')) { // traer un producto por su ID
            const ruta = join(version1, 'productos.json');
            readFile(ruta, (error, datos) => {
                if (error) {
                    response.writeHead(500, {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*'
                    });
                    response.end('Error al leer el archivo de productos.');
                } else {
                    const id = parse(request.url).base;
                    try {
                        const objetoJson = JSON.parse(datos);
                        const arregloProductos = objetoJson.productos;
                        const productoIndividual = arregloProductos.find((producto) => {
                            return (parseInt(producto.id) === parseInt(id));
                        });
                        if (productoIndividual) {
                            response.writeHead(200, {
                                'Content-Type': 'application/json;charset=utf-8',
                                'Access-Control-Allow-Origin': '*'
                            });
                            const jsonCompleto = `
                                {
                                    "productos": [${JSON.stringify(productoIndividual)}]
                                }
                            `;
                            response.end(jsonCompleto);
                        } else {
                            response.writeHead(404, {
                                'Content-Type': 'application/json;charset=utf-8',
                                'Access-Control-Allow-Origin': '*'
                            });
                            response.end('Producto no encontrado');
                        }
                    } catch (e) {
                        response.writeHead(500, {
                            'Content-Type': 'application/json;charset=utf-8',
                            'Access-Control-Allow-Origin': '*'
                        });
                        response.end('Error al procesar JSON');
                    }
                }
            });
        } else {
            response.writeHead(404, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            });
            response.end('Ruta no encontrada');
        }

    } else if (request.method === 'POST') { // Agregar producto
        if (request.url === '/version1/productos') {
            let DatosCliente = '';
            request.on('data', (datos) => {
                DatosCliente += datos;
            });

            request.on('error', (error) => {
                console.error(error);
                response.writeHead(500, {
                    'Content-Type': 'text/plain;charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                response.end('Error en el servidor al recibir los datos del cliente');
            });

            request.on('end', () => {
                const ruta = join(version1, 'productos.json');

                readFile(ruta, (error, datos) => {
                    if (error) {
                        response.writeHead(500, {
                            'Content-Type': 'text/plain',
                            'Access-Control-Allow-Origin': '*'
                        });
                        response.end('Error al leer el archivo de productos');
                    } else {
                        try {
                            const datosJson = JSON.parse(datos);
                            const arregloID = datosJson.productos.map((producto) => {
                                return parseInt(producto.id);
                            });

                            const nuevoProducto = JSON.parse(DatosCliente);
                            nuevoProducto.id = Math.max(...arregloID) + 1;

                            const objetoProducto = {
                                id: nuevoProducto.id,
                                nombre: nuevoProducto.nombre,
                                marca: nuevoProducto.marca,
                                categoria: nuevoProducto.categoria,
                                stock: nuevoProducto.stock
                            };

                            datosJson.productos.push(objetoProducto);
                            const datosJsonCadena = JSON.stringify(datosJson, null, 2);

                            writeFile(ruta, datosJsonCadena, (error) => {
                                if (error) {
                                    response.writeHead(500, {
                                        'Content-Type': 'text/plain;charset=utf-8',
                                        'Access-Control-Allow-Origin': '*'
                                    });
                                    response.end('Ha ocurrido un error al crear el nuevo producto');
                                } else {
                                    console.log('Producto insertado');
                                    response.writeHead(201, {
                                        'Content-Type': 'text/plain;charset=utf-8',
                                        'Access-Control-Allow-Origin': '*'
                                    });
                                    response.end('Recurso creado correctamente');
                                }
                            });
                        } catch (e) {
                            response.writeHead(400, {
                                'Content-Type': 'application/json;charset=utf-8',
                                'Access-Control-Allow-Origin': '*'
                            });
                            response.end('Datos enviados no son JSON válido');
                        }
                    }
                });
            });
        }
    } else if (request.method === 'PUT') { // Modificar producto
        if (request.url.match('/version1/productos/')) {
            const id = parse(request.url).base;
            let DatosCliente = '';
            request.on('data', (datos) => {
                DatosCliente += datos;
            });

            request.on('error', (error) => {
                console.error(error);
                response.writeHead(500, {
                    'Content-Type': 'text/plain;charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                response.end('Error en el servidor al recibir los datos del cliente');
            });

            request.on('end', () => {
                const ruta = join(version1, 'productos.json');
                readFile(ruta, (error, datos) => {
                    if (error) {
                        response.writeHead(500, {
                            'Content-Type': 'text/plain;charset=utf-8',
                            'Access-Control-Allow-Origin': '*'
                        });
                        response.end('Error al leer el archivo de productos');
                    } else {
                        try {
                            const objetoJson = JSON.parse(datos);
                            const productos = objetoJson.productos;
                            const index = productos.findIndex(producto => parseInt(producto.id) === parseInt(id));

                            if (index !== -1) {
                                const nuevoProducto = JSON.parse(DatosCliente);
                                productos[index] = { ...productos[index], ...nuevoProducto }; // Actualizar el producto

                                writeFile(ruta, JSON.stringify(objetoJson, null, 2), (error) => {
                                    if (error) {
                                        response.writeHead(500, {
                                            'Content-Type': 'text/plain;charset=utf-8',
                                            'Access-Control-Allow-Origin': '*'
                                        });
                                        response.end('Error en el servidor');
                                    } else {
                                        response.writeHead(200, {
                                            'Content-Type': 'application/json;charset=utf-8',
                                            'Access-Control-Allow-Origin': '*'
                                        });
                                        response.end(JSON.stringify(productos[index]));
                                    }
                                });
                            } else {
                                response.writeHead(404, {
                                    'Content-Type': 'application/json;charset=utf-8',
                                    'Access-Control-Allow-Origin': '*'
                                });
                                response.end('Producto no encontrado');
                            }
                        } catch (e) {
                            response.writeHead(400, {
                                'Content-Type': 'application/json;charset=utf-8',
                                'Access-Control-Allow-Origin': '*'
                            });
                            response.end('Datos enviados no son JSON válido');
                        }
                    }
                });
            });
        }
    } else if (request.method === 'DELETE') { // Eliminar producto
        if (request.url.match('/version1/productos/')) {
            eliminarProducto(request, response, version1); // Llamar a la función eliminarProducto
        }
    } else {
        response.writeHead(404, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        response.end('Ocurrió un error en el servidor');
    }
});

server.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});


