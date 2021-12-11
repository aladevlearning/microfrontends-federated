exports.handler = async (event, context, callback) => {
    /*
     * Generate HTTP redirect response with 302 status code and Location header.
     */

    console.log('Lambda@EdgeMFE event . NEW', JSON.stringify(event));
    console.log('Lambda@EdgeMFE context', JSON.stringify(context));


    const { request } = event.Records[0].cf;
    let uri = request.uri;

    console.log('Lambda@EdgeMFE event out');

    if (uri === '' || uri === '/' || uri.indexOf("mfe-app2") !== -1 || uri.indexOf("mfe-app3") !== -1) {
        console.log('Lambda@EdgeMFE event in');
        const s3DomainName = 'microfrontends-federation.s3.amazonaws.com';

        /* Set S3 origin fields */
        request.origin = {
            s3: {
                domainName: s3DomainName,
                region: 'eu-west-1',
                authMethod: 'none',
                path: ''
            }
        };


        request.headers['host'] = [{ key: 'host', value: s3DomainName }];
    }


    if (uri === '' || uri === '/') {
        request.uri += '/mfe-app1/';
    }

    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }

    // Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }




    callback(null, request);

};
