const Docker = require('dockerode');
let docker = new Docker(); 
const { goblin_config } = require("./config");
const goblinConfig = require('./config/goblin.config');
/**
 * 
 * @param {string} name
 * @param {string} image
 * @param {string} port
 * @returns { Promise<{error: any, container: Docker.Container, inspect: Docker.ContainerInspectInfo}> }
 */
async function create_docker(name,image,port) {
    return new Promise((resolve, reject) => {
        let _port = {}
        _port[port] = {}
        docker.createContainer({
        AttachStderr: false,
        AttachStdin: true,
        AttachStdout: true,
        Image: image,
        name: name,
        ExposedPorts: _port,
        HostConfig: {
            PublishAllPorts: true,
        },
        }, async (error, container) => {
            let inspect = undefined
            if (container) {
                container.start()
                while (true) {
                    let _inspect = await container.inspect()
                    if (_inspect?.NetworkSettings?.Ports[port]) {
                        inspect = _inspect;
                        break;
                    }
                }
            }
            resolve({error, container, inspect})
        })})
}
/**
 * 
 * @param {string} name
 * @returns { Docker.ContainerInfo | undefined }
 */
async function find_container(name) {
    return new Promise(async (resolve, reject) => {
        let cont = (await docker.listContainers()).filter(
            c=>c.Names.includes(`/${name}`)
        )
        if (cont.length>0)
            resolve(cont[0])
        resolve(undefined)
    })
}
/**
 * 
 * @param {string} Id
 * @param { {options?: {} | undefined} } options
 * @returns { Promise<Docker.Container> }
 */
async function inspect_docer(Id, options) {
    return new Promise(async (resolve, reject) => {
        resolve(await docker.getContainer(Id).inspect())
    })
}
(async () => {
    // let { error, container, inspect } = await create_docker(
    //     "match-test",
    //     goblinConfig.SERVER_NAME,
    //     goblinConfig.SERVER_PORT
    // )
    // if (error) process.exit(1)
    // console.log(inspect.NetworkSettings.Ports);
    // console.log(res);
})();