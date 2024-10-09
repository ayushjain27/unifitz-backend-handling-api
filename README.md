// TO-DOs
// multikey index for mobileNumber_role in user collection
// DB Services - Done for store
// add Controllers for each flow -> Done for Store
// Priority - add store POST endpoint -> Base done


 

//Catalog migration script, Dont remove
app.get('/catalog', (req, res) => {
  const node_xj = require('xls-to-json');
  node_xj(
    {
      input:
        'C:\\Users\\kjagj\\OneDrive\\Desktop\\freelance\\service_plug_apis\\src\\Catalog.xlsx', // input xls
      output: 'output.json', // output json
      sheet: 'Sheet1', // specific sheetname
      rowsToSkip: 1, // number of rows to skip at the top of the sheet; defaults to 0
      allowEmptyValue: false,
      allowEmptyKey: false // avoids empty keys in the output, example: {"": "something"}; default: true
    },
    async function (err: any, result: any) {
      if (err) {
        console.error(err);
      } else {
        const res1 = [
          {
            Cycles: 'Multi Brands',
            'Two Wheelers': 'Multi Brands',
            'Three Wheelers': 'Multi Brands',
            Cars: 'Multi Brands',
            'Commercial Vehicle': 'Multi Brands'
          },
          {
            Cycles: '',
            'Two Wheelers': 'Hero',
            'Three Wheelers': 'Bajaj RE',
            Cars: 'Maruti Suzuki',
            'Commercial Vehicle': 'TATA'
          }
        ];
        const catalog = {
          catalogName: 'Showroom',
          tree: `root`,
          parent: 'root',
          catalogType: 'category'
        };

        const cat = new Catalog(catalog);

        await cat.save();
        for (let [key, value] of Object.entries(res1[0])) {
          console.log(`${key}: ${value}`);
          const catalog = {
            catalogName: key,
            tree: `root/Showroom`,
            parent: 'Showroom',
            catalogType: 'subCategory'
          };

          const cat = new Catalog(catalog);

          await cat.save();
        }
        for (const cat of result) {
          for (let [key, value] of Object.entries(cat)) {
            console.log(`${key}: ${value}`);
            if (value) {
              const catalog = {
                catalogName: value,
                tree: `root/Showroom/${key}`,
                parent: key,
                catalogType: 'brand'
              };
              const cat = new Catalog(catalog);
              await cat.save();
            }
          }
        }
      }
    }
  );
  res.send('OK');
});