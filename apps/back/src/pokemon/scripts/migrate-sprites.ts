import { MongoClient } from 'mongodb';

async function migrateSprites() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('PokemonBD');
    const collection = db.collection('pokemon');

    const collections = await db.listCollections().toArray();
    console.log(
      'Collections:',
      collections.map((c) => c.name),
    );

    const cursor = collection.find({
      sprites: { $type: 'string' },
    });

    let updatedCount = 0;

    while (await cursor.hasNext()) {
      const pokemon = await cursor.next();

      if (!pokemon || typeof pokemon.sprites !== 'string') continue;

      const animated = pokemon.sprites;

      const frontStatic = animated
        .replace('animated/', '')
        .replace(/\.gif$/, '.png');

      const result = await collection.updateOne(
        { _id: pokemon._id },
        {
          $set: {
            sprites: {
              front_static: frontStatic,
              animated,
            },
          },
        },
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`Updated Pokémon with _id: ${pokemon._id}`);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} documents.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

migrateSprites();
