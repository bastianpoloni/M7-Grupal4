import { REFUSED } from "dns";
import pg from "pg";
import Cursor from "pg-cursor";

const { Pool } = pg;

const config = {
  user: "bastianpoloni",
  database: "banco",
  password: "",
  port: 5432,
};

const pool = new Pool(config);

const desc = process.argv[2];
const fecha = process.argv[3];
const monto = process.argv[4];
const cuenta = process.argv[5];

async function newTransaction(desc, fecha, monto, cuenta) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO transacciones (descripcion, fecha, monto, cuenta) VALUES ($1, $2, $3, $4);`,
      [desc, fecha, monto, cuenta]
    );
    const saldo = await client.query(
      `SELECT saldo FROM cuentas WHERE id = $1;`, [cuenta]
    );
    if (saldo >= monto) {
      await client.query(
        `UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2;`,
        [monto, cuenta]
      );
    }
    await client.query("COMMIT");
    
    const result = await client.query(
      `SELECT * FROM transacciones WHERE fecha = $1;`, [fecha]
    );
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
}

function transacciones(cuenta) {
    pool.connect(
    (err, client, done) => {
        if (err) throw err;
        const result = client.query(
            new Cursor('SELECT * FROM transacciones WHERE cuenta = $1;', [cuenta])
        );
    result.read(10,(err,rows)=>{
        if (err) throw err;
        result.close((err)=>{
            if (err) throw err;
            done();
            console.log(rows);
        });
    });
    }
  );

 
}

newTransaction(desc, fecha, monto, cuenta);

// transacciones(desc);