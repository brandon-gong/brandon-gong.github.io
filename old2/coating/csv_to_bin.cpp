#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>

using namespace std;

int main(int argc, char** argv) {

	// in
	if(argc != 2) {
		cout << "Usage: " << argv[0] << " <path to CSV file>" << endl;
		exit(EXIT_FAILURE);
	}
	vector<bool> zips(100000, 0);
	ifstream csvFile(argv[1]);
	string line;
	if (csvFile.is_open()) {
    while(getline (csvFile,line)) {
			stringstream s(line);
			while(s.good()) {
				string numStr;
				getline(s, numStr, ',');
				if(numStr.length() != 5) continue;
				try {
					int val = stoi(numStr);
					if(val >= 0 && val < 100000) zips[val] = 1;
				} catch(const invalid_argument& e) {
					continue;
				}
			}
    }
    csvFile.close();
	} else {
		cout << "Unable to find CSV file " << argv[1] << endl;
		exit(EXIT_FAILURE);
	}
	
	// out
	char c[100000/8] = {0};
	for(int i = 0; i < 100000/8; i++) {
		for(int j = 0; j < 8; j++) {
			c[i] |= zips[i*8+j] << j;
		}
	}
	ofstream binFile ("data.bin", ios :: binary);
	binFile.write(reinterpret_cast<char *> (&c),sizeof(c));
	binFile.close();
}


/// for testing
/*
int main() {
	ifstream binFile("data.bin", ios::binary);
	char c[100000/8] = {0};
	binFile.read(c, 100000);
	while(1) {
		string i;
		cin >> i;
		if(i.length() != 5) continue;
		int x = stoi(i);
		cout << ((c[x / 8] >> ((x % 8))) & 1) << endl;
	}
}
*/