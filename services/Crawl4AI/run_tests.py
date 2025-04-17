"""
Runner script for Crawl4AI service tests.
This will run both unit and integration tests.
"""
import os
import sys
import subprocess
import argparse

def run_command(cmd, cwd=None):
    """Run a command and return the output."""
    print(f"Running: {' '.join(cmd)}")
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    if proc.returncode != 0:
        print(f"Command failed with exit code {proc.returncode}")
        print(f"STDOUT: {proc.stdout}")
        print(f"STDERR: {proc.stderr}")
        return False
    print(proc.stdout)
    return True

def run_unit_tests():
    """Run the unit tests for the Crawl4AI service."""
    print("Running unit tests...")
    venv_python = "/home/soushi888/Projets/Caramoussin/flux-rss-fabric-ai/.venv/bin/python"
    return run_command([venv_python, "-m", "pytest", "tests/test_unit.py", "-v"])

def run_integration_tests():
    """Run the integration tests for the Crawl4AI service."""
    print("Running integration tests...")
    venv_python = "/home/soushi888/Projets/Caramoussin/flux-rss-fabric-ai/.venv/bin/python"
    return run_command([venv_python, "-m", "pytest", "tests/test_integration.py", "-v"])

def check_server():
    """Check if the server is running."""
    try:
        import requests
        response = requests.get("http://localhost:8000/")
        return response.status_code == 200
    except:
        return False

def main():
    """Main entry point for the test runner."""
    parser = argparse.ArgumentParser(description="Run tests for the Crawl4AI service")
    parser.add_argument("--unit", action="store_true", help="Run unit tests only")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    parser.add_argument("--start-server", action="store_true", help="Start server before running tests")
    args = parser.parse_args()
    
    # Create tests directory if it doesn't exist
    os.makedirs("tests", exist_ok=True)
    
    # If no specific test type is specified, run all tests
    run_all = not args.unit and not args.integration
    
    # Start server if requested
    server_process = None
    if args.start_server and not check_server():
        print("Starting Crawl4AI server...")
        venv_python = "/home/soushi888/Projets/Caramoussin/flux-rss-fabric-ai/.venv/bin/python"
        server_process = subprocess.Popen(
            [venv_python, "run.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        # Wait for server to start
        import time
        for _ in range(10):
            if check_server():
                break
            time.sleep(1)
        else:
            print("Failed to start server!")
            if server_process:
                server_process.terminate()
            return 1
    
    success = True
    try:
        # Run unit tests
        if args.unit or run_all:
            unit_success = run_unit_tests()
            success = success and unit_success
        
        # Run integration tests
        if args.integration or run_all:
            if not check_server():
                print("Warning: Server is not running. Integration tests will be skipped.")
            else:
                integration_success = run_integration_tests()
                success = success and integration_success
    finally:
        # Terminate server if we started it
        if server_process:
            print("Stopping server...")
            server_process.terminate()
    
    if success:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 