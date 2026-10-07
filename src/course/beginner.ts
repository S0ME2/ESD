export interface BeginnerGuide {
 intro:string;
 explanation:string[];
 analogy:[string,string];
 words:[string,string][];
 stages:[string,string][];
 topicStages:(number|null)[];
 exampleStage:number|null;
 exampleTopic:number;
}
function guide(intro:string,explanation:string[],analogy:[string,string],words:[string,string][],stages:[string,string][],topicStages:(number|null)[],exampleStage:number|null,exampleTopic:number):BeginnerGuide {
 return {intro,explanation,analogy,words,stages,topicStages,exampleStage,exampleTopic};
}
export const beginner:BeginnerGuide[]=[
 guide('An address sends a CPU write to memory or hardware.',[
  'The **CPU** executes instructions using small working stores called **registers**. **Flash** keeps the program without power; **SRAM** holds changing values.',
  'An **address** selects a destination. Writing to SRAM stores data; writing to a device register can operate hardware.',
  '**GPIO** means pins software can read or drive. **PA5** is pin 5 of group A, wired to LED LD4. Enable its hardware clock and output mode before driving it.'
 ],['Think of an address as a room number. Delivering a note to a storeroom saves it; delivering it to a control room can operate a machine.','Hardware addresses do not all behave like storage: a write can issue a command, and a read can have an effect.'],[
  ['Register','A small named place for a number. CPU registers support calculations; peripheral registers control hardware.'],['GPIO','General-purpose input/output: pins software can read or drive.'],['BSRR','A GPIO command register that sets or clears selected output bits.'],['PA5 / LD4','Pin 5 in GPIO group A / the board’s LED connected to that pin.'],['Address','A number selecting a memory location or a hardware register. 0x prefixes a hexadecimal number.'],['Output latch','The stored output bit which GPIO output mode connects to a pin.']
 ],[
  ['The CPU box sends 0x20 to GPIOA BSRR at 0x50000018.','**STR** means store. r0 holds the value; r1 holds its destination address.'],
  ['The signal reaches GPIOA BSRR; SRAM and Flash stay separate.','Address decoding selects one destination. This write requests a pin change rather than storing an SRAM variable.'],
  ['The signal travels from GPIOA toward PA5; LD4 remains off.','0x20 is hexadecimal 32 = 1<<5: only bit 5 is one. BSRR stores an ON request in the output latch, the saved pin value.'],
  ['PA5 changes to HIGH and LD4 lights.','Output mode connects the saved ON request to PA5. With its clock enabled, the pin drives the wired LED.']
 ],[0,1,0,null,3],3,1),
 guide('Load a value, edit the CPU copy, then store it.',[
  '**LDR** loads an addressed value into a CPU register; **STR** stores it back. Arithmetic edits the register copy.',
  'A **mask** selects bits. Clearing bits 2:0 changes 0xA5 to 0xA0; setting bit 0 gives 0xA1. Other bits stay unchanged.',
  'Instructions also compare, branch and call functions. The **calling convention** defines registers for arguments, results and saved values.'
 ],['Imagine editing a copy of a form on your desk, then handing it back. The office’s stored form does not change while you edit your copy.','The CPU can be interrupted between instructions. A C assignment is not necessarily one indivisible hardware operation.'],[
  ['LDR / STR','Load a value into a CPU register / store a register value to an address.'],['Bit mask','A bit pattern selecting positions: bits 2:0 means bits 2, 1 and 0; 00000111 is 0x07, decimal 7.'],['AND / OR / NOT','AND keeps a bit only if both inputs are 1. OR sets it if either is 1. NOT flips every bit; ~ is the NOT symbol.'],['BIC / ORR','Bit Clear: AND with the inverted mask / OR: set each bit whose mask bit is 1.'],['FLASH ACR','Flash access-control peripheral register; R0 is the separate CPU working copy.'],['Flags','Small CPU status bits that record results used by conditional branches.']
 ],[
  ['R0 shows LDR 0xA5; FLASH ACR also holds 0xA5.','LDR copies the peripheral value into R0, a separate CPU working store.'],
  ['BIC receives mask 0x07; R0 changes from 0xA5 to 0xA0 when the instruction commits.','Bits 2:0 select 00000111 = 7. **NOT** flips that mask to 11111000 in the shown eight-bit window. **AND** keeps upper bits where the inverted mask is 1 and clears lower bits where it is 0. BIC performs that operation; bits 31:3 stay unchanged.'],
  ['ORR receives 0x01; R0 changes from 0xA0 to 0xA1 when the instruction commits.','**OR** with 00000001 sets bit 0 and keeps every other bit. FLASH ACR remains 0xA5 while the CPU edits R0. Each instruction commits whole bits, not fractional bit values.'],
  ['0xA1 moves toward FLASH ACR; its value changes near the stage end.','STR stores R0 back. This commits the edit to the peripheral; the preceding calculations did not.']
 ],[0,0,null,null,null],2,0),
 guide('Build tools turn C source into executable bytes.',[
  'The **preprocessor** expands headers/macros. The **compiler** chooses instructions; the **assembler** encodes them. The **linker** joins files, resolves names and assigns addresses.',
  'Code and read-only constants stay in Flash. Initialized writable variables need SRAM plus a starting Flash copy, which startup copies into SRAM.',
  'Zero-initialized variables need SRAM but no Flash array of zeros. Startup clears their range. The **linker map** reports placement and memory use.'
 ],['A recipe goes through preparation, cooking, and serving. Each step produces something the next step needs.','Build stages transform representations of the program; they do not run the program. A successful build can still contain a logic bug.'],[
  ['Object file','Instructions and data from one source file, with names still to resolve.'],['Linker','The tool that joins files and assigns final addresses.'],['.text / .rodata','Sections for instructions / read-only data.'],['.data / .bss','Writable initialized data / writable data that starts at zero.']
 ],[
  ['Preprocess highlights main.c; expanded C moves through the stage.','Included declarations and macros expand into the source seen by the compiler.'],
  ['Compile + assemble highlights main.o; encoded object bytes move through the stage.','An object file contains encoded instructions, data and names not yet connected to other files.'],
  ['Link highlights firmware.elf; a linked image moves through the stage.','The linker assigns addresses. Initialized writable data has a Flash starting copy and an SRAM working copy.'],
  ['Load + startup highlights main(); the RAM-ready marker follows initialization.','Loading Flash bytes is followed by copying initialized data and zeroing other globals before main runs.']
 ],[0,2,2,null,null],2,2),
 guide('An interrupt can pause an increment and lose an update.',[
  'The CPU executes one instruction at a time. An **interrupt handler** can pause main, change shared memory, then let main resume.',
  'counter++ reads, adds and writes. If both contexts read 10, both may write 11. Two increments then produce 11 instead of 12.',
  '**volatile** preserves required accesses; it does not protect this sequence. A **critical section** protects the whole update by saving, masking and restoring the interrupt-mask state.'
 ],['Two people read a shared tally of 10, each writes 11, and the second write replaces the first. Nobody records 12.','The CPU is not executing both instructions simultaneously. The problem is their order, not the number of cores.'],[
  ['ISR','Interrupt service routine: code that handles an interrupt.'],['Race condition','A result that depends on the order in which shared operations happen.'],['Atomic','An operation that other relevant work cannot observe or interrupt halfway through.'],['Critical section','A protected region that accesses shared state.'],['R0 / RAM','A private CPU register copy / shared memory holding the counter.'],['Stale','Based on an earlier value; here main computed 11 before the handler updated RAM.'],['LDR / ADD / STR','Read memory into a CPU copy / calculate in that copy / store the copy to memory.']
 ],[
  ['Main reads RAM=10 into its private R0; the moving 10 marks the read.','**LDR** copies the counter. The R0 box changes to 10 when the read finishes, while the separate RAM box stays 10.'],
  ['Main adds 1 to its private copy: 10 becomes 11; RAM remains 10.','The moving +1 is a CPU calculation. The interrupt window is between main’s read and store, so the handler can still read the unchanged RAM value 10.'],
  ['With main paused, the handler reads 10, adds 1, and stores 11 into RAM.','Both contexts began from the same RAM value 10. Exception entry preserves main’s register copy, so the handler’s store does not turn main’s saved 11 into 12.'],
  ['Main resumes and stores its saved 11 over RAM=11. Two increments leave 11, although 12 was required.','**Stale** means computed from old data. Neither context calculated 11+1: both calculated 10+1. Protect the whole read–add–store sequence; **volatile** preserves accesses but cannot prevent this interruption.']
 ],[null,null,3,3,null,null],3,2),
 guide('Startup prepares the stack and globals before main().',[
  'Reset reads two **vector-table** words: initial **MSP**, the main stack pointer, and Reset_Handler’s address.',
  'Startup copies initialized **.data** from Flash to SRAM and zeroes **.bss**. These steps establish the values promised by C declarations.',
  'A **linker symbol** names a boundary address, not automatically a stored C variable. Startup needs correct boundaries and exact vector-handler names.'
 ],['Opening a workshop means finding its starting instructions, preparing the workbench, and laying out the tools before the first job.','RAM might already look clean in a simulator. Startup must still initialize it; real initial contents must not be assumed.'],[
  ['Vector table','A table containing initial startup values and interrupt-handler addresses.'],['MSP','Main stack pointer, used by handlers on this core.'],['Reset_Handler','The first startup function selected after reset.'],['Linker symbol','A named address supplied by the linker.'],['.data / .bss','Writable globals copied from Flash / writable globals cleared to zero in SRAM.'],['PC','Program counter: the address of the next instruction.']
 ],[
  ['Vector words move under the Flash box; MSP reads 0x20003000.','**MSP** is the stack pointer, starting just above SRAM. The second vector word selects Reset_Handler, the startup code.'],
  ['Flash values 12, 34, 56 and 78 replace SRAM .data question marks.','The moving value and filling cells show startup making writable copies of initialized globals.'],
  ['Zero values move into SRAM .bss; whole cells replace question marks.','The .bss range holds zero-initialized globals. Startup clears it regardless of previous SRAM contents.'],
  ['Both SRAM ranges are prepared; the enter main() marker follows runtime initialization.','C code can now rely on its declared global values. Missing either preparation step breaks that promise.']
 ],[0,1,1,0,null],0,0),
 guide('A button needs electrical setup and a complete interrupt route.',[
  'A GPIO **output latch** stores the requested bit; the pin is the physical wire. Clock, mode and output type determine whether it drives that wire.',
  'A **pull-up** keeps a released input high. An **active-low** button grounds it when pressed. Mechanical **bounce** can create several edges per press.',
  'An interrupt needs edge detection, a recorded request, enabled delivery and the right handler. Clear the source flag using its documented rule.'
 ],['A doorbell needs a button, working wiring, an enabled bell, and someone to respond. A working button alone does not prove the whole route works.','Interrupt flags record hardware events, not necessarily separate human presses. Several edges can come from one bouncing switch.'],[
  ['Pull-up','A resistor that brings an undriven input toward the supply voltage.'],['EXTI','The chip’s external interrupt edge detector and source flags.'],['NVIC','The CPU’s interrupt controller, which controls delivery and priority.'],['Pending flag','A recorded interrupt request waiting to be handled.'],['FPR1','Falling-edge pending register: bit 1 records the PA1 falling event.'],['IRQ / vector','An interrupt request number / a table entry containing its handler address.'],['Active-low','The pressed or active state is a low voltage, read as 0.']
 ],[
  ['The switch closes toward ground; the PA1 trace falls from high to low.','The resistor pulls a released button toward 3.3 V. Pressing connects PA1 to ground: active-low means pressed reads zero.'],
  ['EXTI highlights FPR1 bit 1 = 1; the request travels toward NVIC.','**EXTI** detects pin edges. FPR1 records the falling event; a recorded request can exist while delivery is disabled.'],
  ['NVIC highlights IRQ 5 enabled; the signal travels toward CPU.','**NVIC** is the interrupt controller. Enabled means this request may reach the CPU if masking and priority permit it.'],
  ['CPU enters through Vector 21; the handler clears FPR1 bit 1, then resumes main.','IRQ means interrupt request. IRQ 5 uses vector entry 16+5=21. The handler acknowledges the falling-edge source using its documented clear rule; FPR1 returns to 0 so the old event cannot repeatedly request service.']
 ],[null,0,null,null,2,3,2],null,0),
 guide('A timer counts ticks and generates repeating pulses.',[
  '**PSC**, the prescaler, divides the clock by PSC+1. At 48 MHz with PSC=47, ticks arrive at 1 MHz: one per microsecond.',
  '**CNT** counts 0 through **ARR**. ARR=19999 gives 20000 ticks = 20 ms = 50 Hz.',
  'In this **PWM** mode, output is high while CNT<CCR1. **CCR1**=1500 gives a 1.5 ms pulse. Input capture instead saves CNT when an input edge arrives.'
 ],['A clock hand passes a marked interval on every lap. That interval can turn a switch on; the rest of the lap turns it off.','Timer counts include zero. Divider and period calculations need the +1 terms; elapsed-time subtraction also needs the correct wraparound rules.'],[
  ['CNT','The timer’s current count.'],['PSC / ARR','Prescaler setting / last count before the counter wraps.'],['CCR1','Compare value for channel 1; here it ends the high pulse.'],['PWM','Pulse-width modulation: repeating pulses whose high duration can be changed.']
 ],[
  ['The divider reads 48 MHz ÷ (47 + 1); CNT is zero and PA6 is HIGH.','PSC=47 divides by 48, so one tick lasts 1 microsecond. **CNT** means ticks counted so far.'],
  ['CNT rises from 0 to 1499; the cursor crosses the high waveform.','CCR1=1500 is the pulse-ending threshold. CNT below 1500 keeps PA6 HIGH for 1500 ticks = 1.5 ms.'],
  ['CNT rises from 1500 toward 19999; PA6 reads OFF (LOW).','The pulse ended, but counting continues for 18.5 ms. The cursor marks time; its low dot follows the pin voltage.'],
  ['CNT restarts at zero; PA6 is HIGH and the cursor enters the next pulse.','Counts 0–19999 make 20000 ticks = 20 ms. Repeating every 0.020 seconds gives 50 Hz, or 50 pulses per second.']
 ],[null,0,1,null,null,null],0,1),
 guide('Task switching saves one task’s work and restores another’s.',[
  'A **task** is a program flow. A **context** contains registers and stack position needed to resume it; one CPU executes one flow at a time.',
  'A **ready** task can run; a **blocked** task waits for a message or resource. The **scheduler** chooses among ready tasks.',
  'A **mutex** gives one task resource ownership; a **queue** carries messages. **Priority inheritance** helps a less urgent lock owner finish for a more urgent waiting task.'
 ],['A cook pauses one recipe, saves exactly where it reached, and resumes another recipe from its own notes.','An RTOS does not make one core run all tasks at once. Interrupt handlers also have different stack and blocking rules from tasks.'],[
  ['Context','The registers and stack information needed to resume paused work.'],['PSP','Process stack pointer, used for a task’s stack in this design.'],['PendSV','The exception used here to perform task switching.'],['Mutex / queue','A resource-ownership lock / a bounded message store.'],['MSP / PC','Handler stack pointer / instruction address. R0–R12 are CPU working registers; LR stores a return address and xPSR stores status.']
 ],[
  ['The CPU reads Task A executing; the PC marker moves inside it.','**PC** is the instruction position. A uses its own PSP, the process stack pointer; B has a separate saved stack.'],
  ['CPU reads PendSV handler; A’s stack cells become saved.','**PendSV** performs the switch. Hardware and handler save register values so A can resume; the handler itself uses MSP.'],
  ['B’s stack cells become restored; the signal travels into the CPU.','Restoring means loading B’s saved registers and PSP. Selecting a task alone cannot resume its paused instructions.'],
  ['CPU reads Task B executing; A’s cells remain saved.','B resumes its own instruction position. Only one task executes now; A waits with its context preserved.']
 ],[1,null,null,null,1],null,2),
 guide('UART sends timed bytes; software assembles messages.',[
  'Both ends agree on timing and format. **8N1** uses one start bit, eight data bits, no parity and one stop bit: ten bit periods per byte.',
  'UART sends the **least-significant bit** first. The receiver samples with its own clock; no clock wire is supplied.',
  'A **ring buffer** holds bounded incoming data. A **parser** checks message boundaries, length and checksum. Handle overflow and reject malformed messages.'
 ],['Letters can arrive one at a time through a mail slot. You must collect them and recognize where each message ends.','One read from a computer may contain part of a message or several messages. It does not define the protocol boundary.'],[
  ['Baud','Symbols per second; here each symbol carries one data-line bit value.'],['8N1','Eight data bits, no parity bit, one stop bit.'],['Ring buffer','A bounded store with read and write positions that wrap around.'],['Parser','Code that recognizes and checks a complete message.'],['TX / RX','Transmitter / receiver. b0 is the least-significant data bit, worth 1; b7 is worth 128.']
 ],[
  ['The cursor crosses START=0 at the left of the waveform.','TX normally rests high. The low start bit announces a frame; both devices must agree on bit timing.'],
  ['The cursor crosses b0–b7: 1,0,0,0,0,0,1,0.','These eight bits encode 0x41. b0, the lowest-value bit, travels first rather than the usual written binary order.'],
  ['STOP=1 is highlighted after the eight data slots.','The high stop bit ends this ten-bit frame. At 115200 baud, a bit takes 8.68 microseconds and a frame about 86.8.'],
  ['The bottom label reads RX buffer holds 0x41 for the parser.','**RX** means receiver. A buffer stores the byte; a parser checks message structure, which may require more bytes.']
 ],[1,3,null,null],1,0),
 guide('A sensor register index differs from a CPU address.',[
  'An **ADC** converts voltage to a finite code using a reference voltage. Scale and calibration turn that code into a measurement.',
  '**I²C** selects a device, then transfers acknowledged bytes. A register read first sends the desired internal register index, then requests data.',
  '**SPI** shifts bits using a supplied clock and chip select; commands depend on the device. Keep CPU addresses, bus device addresses and register indexes distinct.'
 ],['Calling a building’s phone number reaches the building; asking for an extension reaches a particular room inside it.','An I²C register read is a timed wire protocol, not a direct CPU memory load. An ACK confirms one transfer step, not the correctness of all sensor data.'],[
  ['Device address','The address selecting a participant on the I²C bus.'],['Register index','The number selecting a control or reading inside that device.'],['ACK / NACK','Acknowledgement / no acknowledgement on the ninth clock.'],['Open drain','Drive the wire low or release it; a pull-up produces high.'],['SCL / SDA','I²C clock wire / data wire. START selects a transfer; repeated START changes direction without releasing the bus; STOP releases it.'],['WHO_AM_I','The device identity register; index 0x75 returns 0x68 in this sensor.']
 ],[
  ['The byte label is 0xD0 · write; the sensor address is 0x68.','Shift the seven-bit address left, then add direction bit 0 for write: 0x68<<1 = 0xD0. ACK means the sensor pulls SDA low on clock 9.'],
  ['The byte label becomes 0x75 · register.','0x75 selects WHO_AM_I, the sensor’s identity register. This internal index is not a Cortex-M memory address.'],
  ['The label becomes 0xD1 · read; clock 9 still shows ACK.','After a repeated START, address 0x68 with direction bit 1 becomes 0xD1. The same sensor now supplies data.'],
  ['The result label is 0x68; clock 9 shows NACK → STOP.','SDA carries the returned identity byte. NACK means no acknowledgement: the controller ends this one-byte read, then releases the bus with STOP.']
 ],[null,null,1,null,null],null,0),
 guide('DMA copies samples while the CPU works elsewhere.',[
  '**Fixed point** means an integer with a scale. In Q15, 16384/32768 = 0.5. Multiply with a wide intermediate, then restore the scale.',
  '**DMA** is a hardware data mover. CPU setup defines source, destination, width, count and trigger; hardware then requests transfers.',
  'A consumer reads only a completed, owned buffer region. Detect overwriting or **overrun**. DMA saves instructions but still uses bus bandwidth.'
 ],['An assistant moves completed samples to a tray while you calculate. You agree which tray is ready before you pick it up.','DMA does not decide what the data means and does not make unfinished or overwritten data safe to read.'],[
  ['Fixed point','An integer interpreted using an agreed scale.'],['DMA','Direct memory access: hardware transfers data after configuration.'],['Transfer width','The number of bytes moved for each data item.'],['Buffer ownership','The rule deciding who may fill or consume a memory region now.'],['ADC / SRAM','Analog-to-digital converter producing sample numbers / RAM storing the transferred samples.'],['Injected test sequence','These demonstration ADC codes are deliberately supplied as 1023,1024,…1030. They are not calculated from a shown voltage; DMA copies them unchanged and never increments their values.']
 ],[
  ['ADC says Waiting for conversion; the SRAM buffer contains question marks.','**ADC** converts voltage to a number. Before sampling, the CPU configures DMA’s source, destination, item width, count and trigger.'],
  ['The first injected test sample is 1023; its transfer request enters DMA.','This drawing supplies an invented test sequence 1023–1030 rather than deriving readings from a live voltage. The request asks DMA to copy the supplied code unchanged, while the CPU continues independent work.'],
  ['Eight injected test samples 1023–1030 fill successive SRAM cells.','The example source supplies the next code. DMA does not add one: it copies that code unchanged, then advances the destination address. A question mark denotes an unfinished cell, which software must not consume yet.'],
  ['All eight cells contain numbers; CPU reads Consume finished buffer.','Completion makes this region ready. Ownership prevents reading while DMA refills it; overrun means the producer caught the consumer.']
 ],[null,null,null,2,3],null,1),
 guide('A watchdog resets the chip when essential work stalls.',[
  'Save fault evidence such as the instruction position. On the next boot, **reset-cause flags** distinguish watchdog resets from other causes.',
  'A **watchdog** counts down; refresh restarts it. Refreshing from an interrupt can hide a dead task while that interrupt keeps running.',
  'Each essential job publishes a **heartbeat**, evidence of useful progress. A **supervisor** refreshes only if all are recent; otherwise apply safe outputs and withhold refresh. Sleep needs a reliable wake-up rule.'
 ],['A supervisor checks that each station has finished new work. Hearing one clock tick does not prove every station is working.','A heartbeat must show useful progress, not just that a piece of code ran. A watchdog refresh rule defines what “healthy” means.'],[
  ['Watchdog','An independent countdown that can reset the chip if not refreshed.'],['Heartbeat','A changing counter or signal used as evidence that a job progressed.'],['Supervisor','The job that checks required progress before allowing refresh.'],['Reset cause','Hardware flags recording why the chip restarted.']
 ],[
  ['Sensor and Control tasks read heartbeat advances; the time bar shrinks.','A heartbeat records useful progress. Each essential task needs its own evidence; the countdown runs independently.'],
  ['Supervisor reads refresh permitted; both task heartbeats still advance.','Fresh progress from every required task authorizes restarting the watchdog countdown. One healthy task cannot excuse a stalled one.'],
  ['Control reads STALE · no progress; Supervisor reads refresh withheld.','**Stale** means no recent update. The shrinking bar shows time running out even while other code can still execute.'],
  ['The bar is empty; the label reads RESET → inspect reset-cause flags.','Timeout resets the chip. On the next boot, record why it restarted before clearing the hardware flags.']
 ],[null,null,2,1,null],1,3),
 guide('Draw pixels in SRAM, then transfer them to the display.',[
  'Game logic chooses position. **Rendering** writes pixels into a **framebuffer** in SRAM; the driver sends them to OLED display memory.',
  '128×64 monochrome pixels require 1024 bytes. A byte describes eight vertical pixels; locating one needs a byte index and bit position.',
  'Bus **bandwidth** limits refresh. Transfer changed regions when useful, erasing the old image as well as drawing the new one. Schedule game updates separately.'
 ],['You sketch on paper, then send a copy to a noticeboard. Editing the sketch does not immediately change the board.','The transfer costs bandwidth. Updating one logical object can require clearing old bytes, drawing new bytes, and sending both regions.'],[
  ['Framebuffer','Memory containing the pixels you intend to display.'],['Rendering','Turning game state into pixel values.'],['Dirty region','A region that changed and needs another transfer.'],['Bandwidth','How much data a connection can move per second.'],['OLED / I²C','A display with its own pixel memory / the two-wire serial bus carrying its pixel bytes.']
 ],[
  ['The small game-position marker moves right below the SRAM picture.','Logic calculates a new position first. The OLED square stays left because its display memory has not received new pixels.'],
  ['Whole rows of the old SRAM square move to the new position as pixel bytes commit.','Rendering clears old pixels and draws new ones in the framebuffer. The OLED still shows its previous image.'],
  ['A pixel-bytes packet travels across I²C toward the OLED.','The driver sends the edited framebuffer data, including erased old pixels. The display retains its old image while these teaching transfers are shown. Transfer time is distinct from drawing time.'],
  ['The final byte reaches display RAM; the OLED square moves right to match SRAM.','The display now holds the transferred pixels. Drawing in CPU memory and changing visible output are separate operations.']
 ],[1,2,0,null,null],2,0),
 guide('Estimate tilt, calculate correction, then assign motor commands.',[
  'An **accelerometer** gives a gravity-related tilt clue. A **gyro** measures turning rate; rate×time predicts angle, but bias causes drift.',
  'A **complementary filter** blends that prediction with the tilt clue. **P** reacts to current error, **I** accumulates past error, and **D** reacts to error change.',
  'The **mixer** assigns correction to motors with signs that oppose tilt. Motor limits constrain torque; **anti-windup** prevents excess integral correction.'
 ],['Balancing a tray requires sensing its tilt and adjusting your support. P responds to the current tilt; a history of error and its rate of change can also guide correction.','A controller uses sensor estimates, not the true angle visible to the viewer. Real flight also needs arming, limits, and the full three-axis design.'],[
  ['Estimate','A calculated best guess based on measurements.'],['Gyro','A sensor measuring angular rate, such as degrees per second.'],['Complementary filter','A blend of a motion prediction and a correcting measurement.'],['Mixer','The rule turning a control correction into individual motor commands.'],['Roll / M0–M3','Side-to-side angle in degrees / four normalized motor requests from 0 (minimum) to 1 (maximum).'],['Feedback correction','A signed controller request limited to −100…100 model units; the mixer divides it by 400 to adjust opposite motor pairs.'],['Δ / throttle','Δ means change from the base motor request 0.35000 (throttle). M0/M3 add correction/400; M1/M2 subtract it. Five decimals reveal small differences without enlarging the bars.']
 ],[
  ['The solid drone leans; Truth / estimated roll and the lower trace change.','**Roll** means side-to-side tilt. Truth is simulated physical angle; the trace records it over time. The control loop runs throughout these stages.'],
  ['The dashed angle and estimated-roll number track the moving solid body.','The dashed line is the sensor-based estimate used by the controller. It can differ from the true angle even when smooth.'],
  ['Feedback correction and M0–M3 bars vary as the drone tilts.','The mixer converts correction into individual motor commands. Unequal thrust produces torque, a turning effect that must oppose the error.'],
  ['The body angle keeps changing and the true-roll trace extends.','Motor torque changes rotation; new sensor readings update the next correction. These are repeated loop effects, not a single final action.']
 ],[0,1,2,2,null],1,1),
 guide('A waypoint becomes speed, acceleration and tilt requests.',[
  '**Position error** is desired minus estimated position. An outer controller requests speed; speed error requests acceleration, which becomes tilt.',
  'A **waypoint** is a target. Arrival needs a defined radius and any required dwell time. Delayed measurements describe an earlier position.',
  '**Mission modes** choose goals. Low-battery return and critical-battery landing outrank ordinary requests. Uploaded commands need valid bytes and mission meaning.'
 ],['A driver approaches an address by choosing speed and steering, then slowing near the destination. The address alone is not a motor command.','The drawing uses a simplified horizontal mission. Real flight must also handle delayed measurements, thrust limits, vertical motion, and safety priorities.'],[
  ['Waypoint','A position the mission wants to reach.'],['Cascade','Controllers arranged so one controller supplies the target for the next.'],['RTL','Return to launch: a mode that requests a return toward home.'],['Arrival radius','The allowed distance from a waypoint for accepting arrival.'],['WP / m / tilt','Waypoint / meters of horizontal travel / requested body lean in degrees. The ring is the current target.']
 ],[
  ['The target ring marks a waypoint; the drone and Position · m show actual location.','A waypoint is a requested destination. The trail records achieved motion, not the route the drone has been commanded to follow.'],
  ['Position · m changes and the trail grows toward the current ring.','The difference from the target requests speed; speed error requests acceleration. Both controllers continue running during playback.'],
  ['Requested tilt changes while the drone continues moving.','Tilting directs part of thrust horizontally, creating acceleration. A limited tilt request cannot move the drone instantly to its target.'],
  ['The ring and Mission state identify the current goal as the trail extends.','An arrival rule advances waypoints. Safety modes can replace the ordinary goal; the readouts show whichever mode currently applies.']
 ],[1,null,3,null,null],2,0),
 guide('Darkness sensors estimate the tape; wheel-speed differences steer.',[
  'A **weighted average** estimates line position from sensor darkness. Low total weight means insufficient evidence, not a centered line.',
  '**Error** is estimated position minus the desired center. **P** reacts to error; **D** reacts to its rate of change and can amplify noise.',
  'Wheel-speed difference steers. **Motor lag** delays motion; tires can slip. Tune sample rate, filters, gains and speed for the track and grip.'
 ],['Several people point toward a dark stripe; stronger evidence gets more weight. The robot then steers using their combined estimate.','A missing stripe is not a vote for the center. When evidence is too weak, the robot needs a separate recovery rule.'],[
  ['Weight','How much a sensor reading contributes to the position estimate.'],['Error','Estimated position minus the desired position, with an explicit sign convention.'],['P / D','Correction from current error / correction from error change per second.'],['Motor lag','The delay between a wheel command and the resulting motion.'],['L / R / darkness','Left and right wheel speed in millimeters per second / sensor strength from 0 to 1000; taller bars mean darker tape.']
 ],[
  ['The robot moves over tape; seven Sensor darkness bars change height.','Each sensor sees the nearby region below it. Taller bars mean stronger darkness evidence in this model; the loop runs continuously.'],
  ['Error changes in millimeters, or reads unknown when evidence is insufficient.','A weighted average combines darkness readings into line position. Subtracting desired center gives error; unknown does not mean zero.'],
  ['L and R wheel-speed numbers differ as the robot steers.','Different left/right speeds turn the body. P uses current error and D uses error change per second to choose that difference.'],
  ['The trail grows relative to the tape as sensor bars keep changing.','Motion creates the next observations. Wavering or cutting corners can reflect gains, noise, speed, delayed motors or limited tire grip.']
 ],[0,2,null,null,null],0,0),
 guide('Plan from observed map cells; update the route when evidence changes.',[
  '**Pose** means position and heading. Real pose, estimated pose and learned map can differ. Unknown cells are unobserved; this example initially permits travel through them.',
  '**A*** searches with f=g+h: g is cost so far; h estimates remaining cost. Shortest-route guarantees require estimates appropriate to movement and costs.',
  'A route needs body clearance, immediate-danger stops and **replanning** after new evidence. Bound planning memory and search time.'
 ],['Planning a walk from an unfinished sketch of a room may send you toward a wall that nobody has drawn yet. You update the sketch when you see it.','A valid route on paper does not guarantee safe motion. Position error, body width, stale observations, and braking distance still matter.'],[
  ['Pose','Position and heading: where the robot is and which way it faces.'],['Occupancy grid','A map divided into cells with evidence about obstacles.'],['A*','A route search that combines cost so far with an estimate of cost still to go.'],['Replan','Search for a new route after the old route or map changes.'],['Belief / route','Observed wall cells / a proposed path through cells. Pale cells are unknown or traversable; dark cells are known walls; the dashed line is the current route.']
 ],[
  ['The grid shows robot belief; Known occupied cells counts observed walls.','**Belief** means the current learned map. Unmarked cells may be unknown, not empty; this planner initially permits travel through them.'],
  ['Wall cells and Known occupied cells update as the robot moves.','Sensors add obstacle evidence. The robot cannot plan around a wall merely because a viewer knows it exists.'],
  ['The dashed route and Current route cell count change with the map.','A* searches again when new evidence blocks the route. Its path combines cost already traveled with estimated remaining cost.'],
  ['The robot advances along the current dashed route.','The route guides movement. Clearance for the whole body and immediate-danger checks remain necessary while more evidence arrives.']
 ],[0,null,2,3,null],2,2),
 guide('Balance must control position as well as tilt.',[
  'Gravity increases a lean. Moving the wheels places the axle under the body to oppose falling; body and wheel motion affect each other.',
  'The **state** includes angle, angular rate, position and speed. Tilt-only control may stay upright while drifting; position or full-state control addresses that drift.',
  '**LQR** chooses gains for a linearized model and cost. **Q** weights state errors; **R** weights effort. Model limits, payload and motor limits constrain recovery.'
 ],['Balancing a broom on your hand means moving your hand under it. Keeping the broom vertical while your hand drifts is different from returning to your starting place.','The analogy leaves out wheel dynamics and sensors. The linear model is useful near its operating point, not a proof for every possible fall.'],[
  ['State','The set of quantities needed to describe motion: here position, speed, angle, and angular rate.'],['Feedback','Using the measured or estimated result to choose the next command.'],['LQR','Linear quadratic regulator: state-feedback gains chosen from a model and a weighted cost.'],['Linearization','An approximate linear model near a chosen operating point.'],['Axle / voltage','The wheel-center position in meters / signed motor drive in volts. The dashed vertical line marks the starting position.']
 ],[
  ['The leaning body moves relative to the vertical reference; Body angle changes.','A lean tends to grow under gravity. Moving wheels under the body opposes the fall; the feedback loop runs continuously.'],
  ['Body angle and Axle position change together.','Angle measures lean; axle position measures ground displacement. Returning upright does not necessarily return to the starting position.'],
  ['Motor voltage changes while angle and axle position respond.','LQR combines angle, angular rate, position and speed errors. Available voltage limits the wheel correction it can command.'],
  ['The LQR angle-response trace extends; Axle position shows remaining displacement.','Judge tilt and position separately. A small angle alone does not establish recovery; compare controllers with the same disturbance.']
 ],[0,null,3,null,2],3,4),
 guide('A strategy chooses from its own sensor evidence.',[
  'Range, edge, encoder and contact sensors provide different evidence. Strategies must not read the opponent’s true coordinates.',
  'Edge danger can require **ESCAPE** before attack. Decision delay, motor response, speed and braking distance consume safety margin.',
  'Both robots receive same-instant **sensor snapshots**. Repeat initial conditions and **seeds** across many rounds; keep strategy work within time/memory limits.'
 ],['Players make decisions from what they can see, while a spectator may see both sides. The spectator’s knowledge is not a legal input to either player.','A sensor reading can be incomplete. An encoder measures wheel rotation, which can differ from ground travel when a wheel slips.'],[
  ['Sensor snapshot','A set of observations referring to one instant.'],['SEARCH / ATTACK / ESCAPE','Look for an opponent / move toward it / avoid the arena edge.'],['Referee','The simulation logic applying the shared physics and judging rules.'],['Seed','A starting value that makes a random trial repeatable.'],['Sensor cone','The direction and range a robot can observe; it does not reveal everything inside the arena.']
 ],[
  ['Two robots move inside the arena; cones turn with their bodies.','Cones mark range-sensor reach. Each strategy gets its own observations from the same instant, not the viewer’s complete world picture.'],
  ['Robot 1 and Robot 2 read SEARCH, ATTACK or ESCAPE as their evidence changes.','**SEARCH** looks for an opponent; **ATTACK** approaches it; **ESCAPE** avoids edge danger. Strategy priority decides which need wins.'],
  ['Robot bodies move and turn while their sensor cones follow.','Wheel commands become delayed physical motion. Detecting an edge does not instantly stop the body; braking distance still matters.'],
  ['Positions and decision readouts keep changing as the shared simulation advances.','The referee applies physics and samples both robots again. Repeat trials with controlled seeds to distinguish strategy performance from luck.']
 ],[0,1,null,0,null],2,1),
 guide('Connect inputs, decisions, outputs and recovery to measurable goals.',[
  'Specify input units/sample rates and output **ownership**: who may change each output and what happens when data is unsafe or missing.',
  'For each task, define **period**, **deadline**, execution budget and sharing rules. Sum budget/period for estimated CPU share; this alone cannot prove deadlines.',
  'Measure normal/failure response, memory and safe outputs on the target. Compare results with the professor’s rubric, deliverables and assessment instructions.'
 ],['A relay team needs a clear handoff: what is passed, who owns it next, and what happens if a runner cannot continue.','Task budgets are estimates until measured. A polished demonstration and a low CPU-share calculation do not prove timing or failure recovery.'],[
  ['Period','Time between a task’s releases.'],['Deadline','The latest allowed finish time for a job.'],['Execution budget','The processor time reserved or estimated for that job’s work.'],['Ownership','Which task is allowed to change a peripheral or shared object.'],['Snapshot / heartbeat','A consistent input sample / evidence that a required task advanced.'],['Validity / actuator','Whether input is usable / the hardware output device receiving the command.']
 ],[
  ['Sensor owner highlights; input snapshot travels toward Control task.','A **snapshot** is one consistent set of input values. Publish its age too, so the reader can detect old data.'],
  ['Control task highlights Check age + validity; its output request travels downward.','**Validity** means usable data. Check missing, stale or invalid input before requesting an actuator action.'],
  ['Actuator owner highlights Apply permitted command; heartbeat travels toward Supervisor.','The **actuator** is the output device. One owner applies allowed commands; unsynchronized writers could undo a safety decision.'],
  ['Supervisor highlights Require independent progress; health check returns toward Sensor owner.','Separate heartbeats prove required jobs advanced. The supervisor uses them to allow refresh or trigger the defined recovery rule.']
 ],[null,0,null,3,null],null,2)
];

export const studyStages=[
 {title:'Understand the machine',range:[0,4],goal:'Trace a C operation into instructions and explain where every value lives.',check:'Explain an address, a masked write, a lost update, and startup without looking at the animation.'},
 {title:'Connect software to hardware',range:[5,9],goal:'Follow pins, timer counts, task switches, and message bytes through their complete paths.',check:'Calculate a timer period and UART byte time. Locate a failed interrupt step and explain resource ownership.'},
 {title:'Move data and handle failures',range:[10,12],goal:'Work with scaled numbers, shared buffers, watchdog rules, and display bandwidth.',check:'Calculate a fixed-point product and transfer time. Explain when a buffer is ready and why a watchdog should stop refreshing.'},
 {title:'Explain sensors and motion',range:[13,18],goal:'Connect measurements to estimates, controller decisions, and physical movement.',check:'Work an estimate or steering calculation. Distinguish truth from belief and explain a recovery or safety decision.'},
 {title:'Connect theory and exam practice',range:[19,19],goal:'Explain a complete design using timing, ownership, measurements, and failure evidence.',check:'Complete a random practice run without notes. Explain why each alternative is wrong, review missed lessons, and check the professor’s assessment requirements.'}
];
