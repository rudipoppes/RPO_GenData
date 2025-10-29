export default function Samples() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Integration Samples</h1>
        <p className="mt-2 text-gray-600">
          Examples and code snippets for integrating with the Data Generator API
        </p>
      </div>

      <div className="space-y-8">
        {/* Skylar1 Integration */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Skylar1 (SL1) Integration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step-by-step guide for integrating with Skylar1 using Dynamic Applications
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Step 1: Universal Credential */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                1. Create Universal Credential
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-900 mb-2">Configuration Details:</h4>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="font-medium text-gray-700">URL:</div>
                      <div className="md:col-span-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                          http://{window.location.hostname}:{window.location.port}/api/data
                        </code>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="font-medium text-gray-700">Authentication Type:</div>
                      <div className="md:col-span-2">API Key Authentication</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="font-medium text-gray-700">HTTP Header 1:</div>
                      <div className="md:col-span-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          X-API-KEY:&lt;value of the API key&gt;
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Replace &lt;value of the API key&gt; with your actual API key from the{' '}
                        <a href="/api-keys" className="underline hover:text-yellow-900">API Keys page</a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Dynamic Applications */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                2. Create Dynamic Applications (Performance and Configuration)
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-900 mb-3">Setup Requirements:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Base Dynamic Application on sample code from the <code className="bg-gray-100 px-1 py-0.5 rounded text-xs inline">Low Code Tools Powerpack</code>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Ensure <code className="bg-gray-100 px-1 py-0.5 rounded text-xs inline">Execution Library</code> is set correctly for the DA
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Copy and paste the <code className="bg-gray-100 px-1 py-0.5 rounded text-xs inline">Snippet code</code> from Collection Fields into the "snippet field" for each collection object
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> You can find the snippet code for each collection by visiting the{' '}
                        <a href="/collections" className="underline hover:text-blue-900">Collections page</a>{' '}
                        and viewing the collection details. The snippet contains the exact API call format needed for the DA.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Device Alignment */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                3. Align Dynamic Applications to Devices
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-700 mb-3">
                    Once your Dynamic Applications are created and configured:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Align the new DA(s) to the device you want data to be generated for
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Configure the collection type (Performance or Configuration) based on your requirements
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Test the DA to ensure data generation is working correctly
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Integration Summary</h3>
              <p className="text-sm text-gray-700 mb-3">
                After completing these steps, your Skylar1 system will be able to:
              </p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Authenticate with the Data Generator API using API keys</li>
                <li>• Execute Dynamic Applications that pull data from your collections</li>
                <li>• Generate realistic test data for your monitored devices</li>
                <li>• Support both Performance and Configuration data types</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Start</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Get started with the Data Generator API in just a few steps:
            </p>
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-900 mb-2">1. Set up a Collection</h3>
                <p className="text-sm text-orange-800">
                  Create a <a href="/collections" className="text-orange-600 hover:text-orange-500 underline">Collection</a> and define fields with the data types you need.
                </p>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h3 className="font-medium text-teal-900 mb-2">2. Create an API Key</h3>
                <p className="text-sm text-teal-800">
                  Go to the <a href="/api-keys" className="text-teal-600 hover:text-teal-500 underline">API Keys</a> page and create a new key with the appropriate scopes.
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 mb-2">3. Make API Calls</h3>
                <p className="text-sm text-indigo-800">
                  Use your API key to generate data from your collections.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Examples */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">API Examples</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* cURL */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-medium text-red-900 mb-2">cURL</h3>
              <div className="bg-white p-4 rounded border">
                <code className="text-sm">
                  curl -H "X-API-Key: your-api-key" \<br />
                  &nbsp;&nbsp;"{window.location.origin}/api/data/YourCollection/Performance"
                </code>
              </div>
            </div>

            {/* Python */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-medium text-yellow-900 mb-2">Python</h3>
              <div className="bg-white p-4 rounded border">
                <pre className="text-sm">
{`import requests

headers = {"X-API-Key": "your-api-key"}
response = requests.get(
    "${window.location.origin}/api/data/YourCollection/Performance",
    headers=headers
)
data = response.json()
print(data)`}
                </pre>
              </div>
            </div>

            {/* JavaScript */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
              <h3 className="font-medium text-cyan-900 mb-2">JavaScript</h3>
              <div className="bg-white p-4 rounded border">
                <pre className="text-sm">
{`fetch('${window.location.origin}/api/data/YourCollection/Performance', {
  headers: {
    'X-API-Key': 'your-api-key'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Field Types Reference */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Field Types Reference</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                <h3 className="font-medium text-pink-900 mb-3">Data Types</h3>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-white px-2 py-1 rounded border">string</code> - Text values</div>
                  <div><code className="bg-white px-2 py-1 rounded border">number</code> - Integer values</div>
                  <div><code className="bg-white px-2 py-1 rounded border">boolean</code> - True/false values</div>
                  <div><code className="bg-white px-2 py-1 rounded border">date</code> - Date/time values</div>
                  <div><code className="bg-white px-2 py-1 rounded border">email</code> - Email addresses</div>
                  <div><code className="bg-white px-2 py-1 rounded border">uuid</code> - Unique identifiers</div>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="font-medium text-emerald-900 mb-3">Value Types</h3>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-white px-2 py-1 rounded border">fixed</code> - Static values</div>
                  <div><code className="bg-white px-2 py-1 rounded border">range</code> - Random within range</div>
                  <div><code className="bg-white px-2 py-1 rounded border">list</code> - Pick from list</div>
                  <div><code className="bg-white px-2 py-1 rounded border">pattern</code> - Regex patterns</div>
                  <div><code className="bg-white px-2 py-1 rounded border">epoch</code> - Current timestamp</div>
                  <div><code className="bg-white px-2 py-1 rounded border">increment</code> - Auto-increment</div>
                  <div><code className="bg-white px-2 py-1 rounded border">decrement</code> - Auto-decrement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
