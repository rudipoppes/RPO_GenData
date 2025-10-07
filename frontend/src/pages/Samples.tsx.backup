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
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">1. Create an API Key</h3>
                <p className="text-sm text-gray-600">
                  Go to the <a href="/api-keys" className="text-blue-600 hover:text-blue-500">API Keys</a> page and create a new key with the appropriate scopes.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">2. Set up a Collection</h3>
                <p className="text-sm text-gray-600">
                  Create a <a href="/collections" className="text-blue-600 hover:text-blue-500">Collection</a> and define fields with the data types you need.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">3. Make API Calls</h3>
                <p className="text-sm text-gray-600">
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
            <div>
              <h3 className="font-medium text-gray-900 mb-2">cURL</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <code className="text-sm">
                  curl -H "X-API-Key: your-api-key" \<br />
                  &nbsp;&nbsp;"{window.location.origin}/api/data/YourCollection/Performance"
                </code>
              </div>
            </div>

            {/* Python */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Python</h3>
              <div className="bg-gray-50 p-4 rounded-md">
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
            <div>
              <h3 className="font-medium text-gray-900 mb-2">JavaScript</h3>
              <div className="bg-gray-50 p-4 rounded-md">
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
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Data Types</h3>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-gray-100 px-2 py-1 rounded">string</code> - Text values</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">number</code> - Integer values</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">boolean</code> - True/false values</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">date</code> - Date/time values</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">email</code> - Email addresses</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">uuid</code> - Unique identifiers</div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Value Types</h3>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-gray-100 px-2 py-1 rounded">fixed</code> - Static values</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">range</code> - Random within range</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">list</code> - Pick from list</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">pattern</code> - Regex patterns</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">epoch</code> - Current timestamp</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">increment</code> - Auto-increment</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">decrement</code> - Auto-decrement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
