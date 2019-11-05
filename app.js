/**
 * The cluster module provides a way of creating child processes that runs simultaneously and share the same server port.
 * @const
 */
const cluster = require("cluster");

/**
 * The os module provides a number of operating system-related utility methods.
 * @const
 */
const numCPUs = require("os").cpus().length;

/**
 * A genetator method to distribute the task, in this example to distribute the number of items amongst the workers.
 * @const
 */
const { distributeInteger } = require("./utils");

/**
 * Number of items to be printed. In this example 1 - 100.
 * @const
 */
const n = 100;

/**
 * Array in which value at each index depicts how many elements a worker should print.
 * Example - [ 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 8, 8 ] for a 12 core environment.
 * Length of array is a variable depending on number of cores available in the OS.
 * @const
 */
const groups = [];

/**
 * Loop which iterates throung the generator function and update the groups array.
 * @const
 */
for (let member of distributeInteger(n, numCPUs)) {
  groups.push(member);
}

/**
 * A JS object maintaining worker id's which is later used to restart a worker.
 * @const
 */
let workerIds = {};

/**
 * Cluster module provides us with a property isMaster to see whether the current process is a master or a worker. When we fork a child from master later cluster.isMaster will return false and then we can perform the worker tasks.
 */

if (cluster.isMaster) {
  /**
   * If the current process is master then run this function. This is executed only once because there will be only one master process, all others will be child processes so cluster.isMaster will return false
   */
  masterProcess();
} else {
  /**
   * If the current process is child/worker then run this function. This is executed for each child we fork.
   */
  childProcess();
}

/**
 * Perform Mater Tasks here
 */
function masterProcess() {
  /**
   * Loop through the number of cpus available and fork a child for each cpu
   */
  for (let i = 1; i <= numCPUs; i++) {
    /**
     * Here we are forking a new child from master process.
     * 1. length: Number of items this child has to print
     * 2. endPoint: Last number this child has to print
     * 3. customId: id which is later used to restart the child if it fails
     */
    let worker = cluster.fork({
      length: groups[i - 1],
      endPoint: groups.slice(0, i).reduce((a, b) => a + b, 0),
      customId: i
    });

    // Populating the workerIds object with workhers pid's
    workerIds[worker.process.pid] = i;
  }

  /**
   * This event is emitted when a child is successfully forked
   */
  cluster.on("online", function(worker) {
    console.log(`Process ${worker.process.pid} started`);
  });

  /**
   * This even is emitted when a child is exited or killed. Here we restart the worker if it doesn't exit gracefully means it has not completed it's tasks.
   */
  cluster.on("exit", function(worker, code, signal) {
    // Performing tasks based on the signal the process gives when it is exited or killed.
    switch (signal) {
      // This signal is provided when task is terminated and has not completed the task.
      case "SIGKILL": {
        console.log(`Process ${worker.process.pid} terminated, restarting...`);

        // Fetching the customId we previosly stored.
        let i = workerIds[worker.process.pid];

        // Restarting or forking another child to perform the same task.
        cluster.fork({
          length: groups[i - 1],
          endPoint: groups.slice(0, i).reduce((a, b) => a + b, 0)
        });

        break;
      }
      default: {
        console.log(`Process ${worker.process.pid} completed`);
      }
    }
  });
}

function childProcess() {
  /**
   * Here killing the process with id: 4. Later this needs to be dynamic
   */
  if (process.env.customId == 3) {
    // Killing the process and passing signal SIGKILL
    process.kill(process.pid, "SIGKILL");
  }

  /**
   * Loop to print the numbers.
   */
  for (
    i = process.env.endPoint - process.env.length + 1;
    i <= process.env.endPoint;
    i++
  ) {
    console.log(i);
  }

  /**
   * Gracefully exiting the process.
   */
  process.exit();
}
