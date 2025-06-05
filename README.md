<!-- Back to Top Link-->

<a name="readme-top"></a>

<br />
<div align="center">
  <h1 align="center">Raft Consensus</h1>

  <p align="center">
    <h3>Tugas Besar 1 IF3130 Sistem Paralel dan Terdistribusi</h3>
    <h4> Implementasi RAFT Consensus Menggunakan NodeJS</h4>
<br>

  </p>
</div>

<!-- CONTRIBUTOR -->
<div align="center" id="contributor">
  <strong>
    <h3>Made By:</h3>
    <h3>Kelompok 09:</h3>
    <table align="center">
      <tr>
        <td>NIM</td>
        <td>Nama</td>
      </tr>
      <tr>
        <td>13522037</td>
        <td>Farhan Nafis Rayhan</td>
      </tr>
      <tr>
        <td>13522071</td>
        <td>Bagas Sambega Rosyada</td>
      </tr>
      <tr>
        <td>13522091</td>
        <td>Raden Francisco Trianto B.</td>
      </tr>
    </table>
  </strong>
  <br>
</div>

## External Links

- [Spesifikasi](https://docs.google.com/document/d/1TsojmsiQMC2gVcIgNror7VST06aLwxfx)
- [QNA](https://docs.google.com/spreadsheets/d/1BFbrb6wJ3x9Tkiua4vCoh10M57HWag367ux1RzBui2M)
- [Teams](https://docs.google.com/spreadsheets/d/1FceAZy0w57dwUN7yuCpkYDA7g-mdmCDJBa1_ddvULn0)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ABOUT THE PROJECT -->

## About The Project

Raft Consensus Algorithm  
Based on this paper: https://raft.github.io/raft.pdf 


Consensus protocol/algorithm allows a collection of machine to work as a coherent group that can survive the failure of its members. Used in a distributed system, consesus main idea is to use a voting mechanism to maintain a global data where it needs the majority of vote before changing the global data. 

Raft, itself is one of the consesus algorithm to improve Paxos. Improved from Paxos, Raft uses a leader election, log replication, and safety to better increase the effeciency and structure. This protocol configure how each computer in the system always in sync and match their transaction logs and their order.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

Project dependencies  

- Docker

- NodeJS and npm

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Installation

_How to install and use your project_

1. Clone the repo

   ```sh
   git clone https://github.com/labsister21/tugas-besar-sister-gyatt-belajar.git
   ```

2. Change directory

    ```sh
    cd tugas-besar-sister-gyatt-belajar
    ```

3. Build the program

    ```sh
    docker-compose up --build
    ```


<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- INSTURCTION -->

## Instruction

Run all the servers and clients node at once,

  ```docker
  docker compose up
  ```

  or run a single node, for example one client:
`
  ```docker
  docker compose up client1
  ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<br>
<h3 align="center"> THANK YOU! </h3>
