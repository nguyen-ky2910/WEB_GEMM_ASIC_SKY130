# GEMM 32x32 INT8 trên SKY130

Bộ tăng tốc nhân ma trận INT8 32x32 kiểu weight-stationary. Bản gốc chạy trên FPGA KV260;
repo này đưa nó ra layout trên SKY130 bằng OpenLane 1.0.2. Thiết kế được harden theo tầng:
PE, row (32 PE), array, rồi core GemmAccelerator gồm 32 row macro và 80 SRAM OpenRAM.

## Kết quả (core_v11)

| Mục | Kết quả |
|---|---|
| Die | 7,06 x 10,24 mm (72,3 mm²) |
| Tần số | 100 MHz ở tt/25°C/1,80V; khoảng 57 MHz ở ss/100°C/1,60V |
| DRC | router 0; Magic 0 lỗi thật (48 cờ do view abstract của macro, đã kiểm lại trên layout đầy đủ) |
| LVS | khớp |
| Setup / hold | path nội bộ ở tt: setup +1,21 ns, hold +0,27 ns; hold sạch ở ff với cả RC min và RC max |
| Antenna | còn 219 pin trên 205 net, vượt nhẹ (trung vị 1,4 lần giới hạn), không chân SRAM nào |
| Mô phỏng gate-level | netlist core cùng netlist gate-level của 32 row: PASS cả 3 kích thước ma trận (64x64x64, 8x32x544, 16x992x32), trùng từng chu kỳ với RTL FPGA |
| Công suất | tt/25°C/1,80V, 100 MHz: 1,53 W với activity từ VCD (mô phỏng gate-level cả core lẫn row, pha tính của ma trận 64x64x64); 2,89 W với activity mặc định của OpenSTA |
| Hiệu suất | đỉnh 204,8 GOPS (2 x 32 x 32 x 100 MHz); 134 GOPS/W (theo 1,53 W); 2,83 GOPS/mm² |

## Chạy

Cần OpenLane 1.0.2 (Docker) ở ~/OpenLane, PDK sky130A, iverilog và python3. Repo gốc
GEMM_32x32_KV260 đặt cạnh thư mục này (dùng testbench của nó). Cài đặt, thời gian, cách đọc
kết quả và lỗi hay gặp: HUONGDAN.md.

    openlane/run_flow.sh sim        # RTL ASIC so với RTL FPGA
    openlane/run_flow.sh pe
    openlane/run_flow.sh row
    openlane/run_flow.sh array
    openlane/run_flow.sh core-sim   # RTL core với model SRAM OpenRAM
    openlane/run_flow.sh core-pre
    openlane/run_flow.sh core       # khoảng 7-9,5 giờ, cần 16 GB RAM và 40 GB ổ trống
    openlane/run_flow.sh core-gls   # mô phỏng gate-level netlist cuối

AXI accelerator IP (core bọc AXI4-Lite + 3 cổng AXI4-Stream; thanh ghi 0x00-0x0C như bản KV260, thêm ngắt
`irq`, IRQ_ENABLE/IRQ_STATUS, ERROR, JOB_CYCLES, IP_ID/IP_VERSION ở 0x10-0x24; HUONGDAN.md mục 8):

    openlane/run_flow.sh axi-sim    # slice, shell + model core, testbench gốc với thin/reg/lean(+clock gating)
    openlane/run_flow.sh axi-shell  # harden riêng phần AXI cho thin, reg, lean, lean_cg; bảng overhead so với core
    openlane/run_flow.sh axi-gls    # GEMM_top (lean + clock gating) bọc netlist cuối của core

Mỗi tầng chỉ chạy khi tầng trước đã qua. Kết quả ghi vào openlane/LOG.md,
GDS nằm ở ~/OpenLane/designs/gemm_core/runs/<tag>/results/final/gds/.

## Thư mục

    rtl_asic/   RTL cho ASIC (rtl_asic/axi: wrapper AXI của IP)
    sim/        so sánh với RTL FPGA, mô phỏng gate-level
    openlane/   run_flow.sh và cấu hình từng tầng
    tools/      đọc log, kiểm tra DRC quanh macro, phân tích antenna, timing và công suất

## Ghi chú thiết kế

- Mỗi SRAM đặt sát phần logic dùng nó. Floorplan đầu gom SRAM thành khối lớn thì global route nghẽn tới mức crash.
- Cấm đi dây met5 trên SRAM: SRAM đã chặn met1-met4, dây đổi track trên met5 tạo short không sửa được.
- Sau global route có bước kiểm tra net đi xuyên lòng macro; có thì dừng sớm thay vì chạy DRT vô ích.
- Tắt diode heuristic (nguồn nghẽn chính); LEF của SRAM được bổ sung dữ liệu antenna để công cụ thấy chân SRAM.
- Magic DRC đọc cell chuẩn bằng layout đầy đủ, macro bằng abstract; cờ quanh macro được kiểm lại bằng tools/magic_macro_check.sh.
- repair_timing chạy với -skip_pin_swap, và tầng row so netlist cuối với RTL (sim/row_equiv.sh): LVS không bắt được lỗi đổi chân.

## Hạn chế

- Resizer của bản OpenROAD này có thể đổi chân của cell không giao hoán (and2b) khi sửa timing, và LVS không bắt được
  vì layout khớp với netlist đã sai. Flow chặn bằng -skip_pin_swap và so netlist row với RTL (sim/row_equiv.sh) ở tầng row.
- Antenna chưa về 0: router của bản OpenROAD này không tính antenna khi đi dây và không có chế độ ECO.
- Corner chậm chỉ đạt khoảng 57 MHz; muốn 100 MHz ở mọi corner phải chia lại pipeline.
- Timing ở cổng I/O được miễn vì core chưa có vòng pad (196 path, tệ nhất -0,81 ns ở tt); đây là core, chưa phải chip hoàn chỉnh.
- Công suất SRAM là cận trên: thư viện OpenRAM cho cùng năng lượng mỗi cạnh clock dù SRAM có được chọn hay không.

Lịch sử các lần chạy: NHATKY.md.
