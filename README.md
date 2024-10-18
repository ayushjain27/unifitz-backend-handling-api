
<!-- Docker enable -->
sudo usermod -aG docker ec2-user

# Build and upload your docker build to ECS

1. Build the docker image
```
docker  build --platform linux/amd64 -t serviceplug/serviceplug-dev-api .
```

2. Login to ECS

`
 Make AWS profile for serviceplug in local system
`
```
aws ecr get-login-password --region ap-south-1 --profile <your aws profile || jitin-serviceplug>  | docker login --username AWS --password-stdin 771470636147.dkr.ecr.ap-south-1.amazonaws.com
```


3. Tag your image so you can push the image to this repository:

```
docker tag serviceplug/serviceplug-dev-api:latest 771470636147.dkr.ecr.ap-south-1.amazonaws.com/serviceplug/serviceplug-dev-api:latest
```

4. Run the following command to push this image to your newly created AWS repository:

```
docker push 771470636147.dkr.ecr.ap-south-1.amazonaws.com/serviceplug/serviceplug-dev-api:latest
```

# Deploy the application in ec2 instance staging

1. Login in to AWS:
```
 ssh -i "keys/serviceplug-dev-api.pem" ec2-user@ec2-65-0-188-147.ap-south-1.compute.amazonaws.com
 ```
2. Check if docker image running status:
```
docker ps
```
3. Check the docker images list
```
docker images
```

2. Login to ECS
```
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 771470636147.dkr.ecr.ap-south-1.amazonaws.com
```
3. Pull the docker image from aws ecr
```
docker pull 771470636147.dkr.ecr.ap-south-1.amazonaws.com/serviceplug/serviceplug-dev-api:latest
```
4. Check the docker process
```
docker ps
```
5. Stop the container and delete it to release some space
```
docker stop <container_id>
docker image prune
```
4. Run the docker instance if not running
```
docker run -p 8000:3005 -d <image url>
```

### To check the logs in docker file
```
docker logs -f --tail 10 container_image id
```

### To free up the disk space in server,

```
docker system prune -a --volumes
```

### To check the disk space in human readable format
```
df -h
```


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