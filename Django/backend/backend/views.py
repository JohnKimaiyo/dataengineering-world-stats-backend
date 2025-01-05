import os
import requests
import json
from django.http import JsonResponse
from django.conf import settings


def fetch_and_save_data(request):
    # API URL
    api_url = "https://datausa.io/api/data?drilldowns=Nation&measures=Population"
    
    try:
        # Fetch data from the API
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()

        # Define the folder and file path
        data_folder = os.path.join(settings.BASE_DIR, 'Data')
        os.makedirs(data_folder, exist_ok=True)
        file_path = os.path.join(data_folder, 'population_data.json')

        # Write data to the JSON file
        with open(file_path, 'w') as json_file:
            json.dump(data, json_file, indent=4)

        return JsonResponse({"message": "Data fetched and saved successfully.", "file_path": file_path})
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)
